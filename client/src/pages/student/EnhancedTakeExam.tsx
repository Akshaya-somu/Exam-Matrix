import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  Camera,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { DetectionService } from "@/lib/detection";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import io from "socket.io-client";

export default function EnhancedTakeExam() {
  const [, params] = useRoute("/student/exam/:examId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [webcamActive, setWebcamActive] = useState(false);
  const [phoneActive, setPhoneActive] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState(true);
  const detectionService = useRef(new DetectionService());
  const socketRef = useRef<any>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const phoneVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const hasCreatedSession = useRef(false);

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam", params?.examId],
    queryFn: () => apiRequest(`/api/exams/${params?.examId}`),
    enabled: !!params?.examId,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", params?.examId],
    queryFn: () => apiRequest(`/api/exams/${params?.examId}/questions`),
    enabled: !!params?.examId,
  });

  useEffect(() => {
    if (exam && !hasCreatedSession.current) {
      hasCreatedSession.current = true;
      createSession();
      setupDetection();
      setWebcamActive(true);
      setPhoneActive(true);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [exam]);

  useEffect(() => {
    if (exam && timeRemaining === 0) {
      setTimeRemaining(exam.durationMinutes * 60);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam]);

  const createSession = async () => {
    try {
      const session = await apiRequest("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          examId: params?.examId,
          studentId: "674b8e3f9d5c8a1b4e9f2d1c",
          status: "active",
          startedAt: new Date(),
        }),
      });
      setSessionId(session._id);

      // Fetch QR code for phone camera
      try {
        const qrData = await apiRequest(`/api/sessions/${session._id}/qrcode`);
        setQrCode(qrData.qrCode);
      } catch (err) {
        console.error("Failed to fetch QR code:", err);
      }

      // Start webcam
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
        setWebcamActive(true);

        // Set up WebSocket and WebRTC for proctors
        socketRef.current = io("/", { path: "/ws" });
        socketRef.current.on("connect", () => {
          socketRef.current.emit("join", session._id);

          // Notify server that student is ready to stream
          socketRef.current.emit("student:stream:ready", {
            sessionId: session._id,
            examId: params?.examId,
            studentId: user?.id || "student",
            studentName: user?.username || "Student",
          });
        });

        // Handle proctor requesting video stream
        socketRef.current.on(
          "proctor:request:stream",
          async (data: { proctorId: string }) => {
            try {
              const peerConnection = new RTCPeerConnection({
                iceServers: [
                  { urls: "stun:stun.l.google.com:19302" },
                  { urls: "stun:stun1.l.google.com:19302" },
                ],
              });

              // Add webcam stream tracks to peer connection
              stream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, stream);
              });

              // Handle ICE candidates
              peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                  socketRef.current.emit("webrtc:ice-candidate", {
                    to: data.proctorId,
                    candidate: event.candidate,
                  });
                }
              };

              // Create and send offer to proctor
              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);

              socketRef.current.emit("webrtc:offer", {
                to: data.proctorId,
                offer: offer,
                sessionId: session._id,
              });

              // Handle answer from proctor
              socketRef.current.on(
                "webrtc:answer",
                async (answerData: {
                  from: string;
                  answer: RTCSessionDescriptionInit;
                }) => {
                  if (answerData.from === data.proctorId) {
                    await peerConnection.setRemoteDescription(
                      new RTCSessionDescription(answerData.answer)
                    );
                  }
                }
              );

              // Handle ICE candidates from proctor
              socketRef.current.on(
                "webrtc:ice-candidate",
                async (candidateData: {
                  from: string;
                  candidate: RTCIceCandidateInit;
                }) => {
                  if (
                    candidateData.from === data.proctorId &&
                    candidateData.candidate
                  ) {
                    await peerConnection.addIceCandidate(
                      new RTCIceCandidate(candidateData.candidate)
                    );
                  }
                }
              );
            } catch (error) {
              console.error("WebRTC setup error:", error);
            }
          }
        );
      } catch (err) {
        console.error("Webcam error:", err);
        toast({
          title: "Camera Error",
          description: "Failed to access webcam",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Session creation error:", error);
    }
  };

  const setupDetection = () => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("copy", (e) => e.preventDefault());
    document.addEventListener("paste", (e) => e.preventDefault());
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      const alert = detectionService.current.detectTabSwitch();
      handleAlert(alert);
      toast({
        title: "Warning",
        description: "Tab switching detected!",
        variant: "destructive",
      });
    }
  };

  const handleAlert = async (alert: any) => {
    setAlerts((prev) => [...prev, alert]);

    if (sessionId) {
      try {
        await apiRequest(`/api/sessions/${sessionId}/events`, {
          method: "POST",
          body: JSON.stringify({
            type: alert.type,
            severity: alert.confidence > 0.8 ? "high" : "medium",
            payload: alert,
          }),
        });
      } catch (error) {
        console.error("Failed to send alert:", error);
      }
    }
  };

  const saveAnswer = async (questionId: string, answerText: string) => {
    if (!sessionId) return;

    try {
      await apiRequest(`/api/sessions/${sessionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ questionId, answerText }),
      });
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
    saveAnswer(questionId, value);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) return;

      await apiRequest(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "completed",
          endedAt: new Date(),
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "Exam submitted successfully!" });
      setLocation("/student/dashboard");
    },
  });

  const handleSubmit = () => {
    if (confirm("Are you sure you want to submit your exam?")) {
      submitMutation.mutate();
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const nextQuestion = () => {
    if (questions && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (examLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Exam not found</h1>
          <Button onClick={() => setLocation("/student/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{exam.name}</h1>
              <p className="text-sm text-gray-500">
                {exam.description || "Comprehensive assessment"}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge
                  variant={webcamActive ? "default" : "destructive"}
                  className="gap-1"
                >
                  <Camera className="w-3 h-3" />
                  {webcamActive ? "Webcam" : "Inactive"}
                </Badge>
                <Badge
                  variant={phoneActive ? "default" : "destructive"}
                  className="gap-1"
                >
                  <Smartphone className="w-3 h-3" />
                  {phoneActive ? "Phone" : "Connected"}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-500">Time Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Question Navigation */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    Question Navigation
                  </div>
                  <div className="text-sm font-medium">
                    Question {currentQuestion + 1} of {questions.length}
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {questions.map((q: any, index: number) => (
                    <button
                      key={q._id}
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center font-medium text-sm transition ${
                        index === currentQuestion
                          ? "border-blue-600 bg-blue-600 text-white"
                          : answers[q._id]
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {currentQ.questionType.toUpperCase().replace("_", " ")}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      {currentQ.points} points
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Question {currentQuestion + 1} of {questions.length}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-lg font-medium text-gray-900 mb-4">
                    {currentQ.questionText}
                  </p>

                  {currentQ.questionType === "multiple_choice" &&
                    currentQ.options && (
                      <RadioGroup
                        value={answers[currentQ._id] || ""}
                        onValueChange={(value) =>
                          handleAnswerChange(currentQ._id, value)
                        }
                      >
                        <div className="space-y-3">
                          {currentQ.options.map(
                            (option: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                              >
                                <RadioGroupItem
                                  value={option}
                                  id={`option-${idx}`}
                                />
                                <Label
                                  htmlFor={`option-${idx}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  {option}
                                </Label>
                              </div>
                            )
                          )}
                        </div>
                      </RadioGroup>
                    )}

                  {currentQ.questionType === "true_false" && (
                    <RadioGroup
                      value={answers[currentQ._id] || ""}
                      onValueChange={(value) =>
                        handleAnswerChange(currentQ._id, value)
                      }
                    >
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                          <RadioGroupItem value="true" id="true" />
                          <Label
                            htmlFor="true"
                            className="flex-1 cursor-pointer"
                          >
                            True
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                          <RadioGroupItem value="false" id="false" />
                          <Label
                            htmlFor="false"
                            className="flex-1 cursor-pointer"
                          >
                            False
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  )}

                  {(currentQ.questionType === "short_answer" ||
                    currentQ.questionType === "essay" ||
                    currentQ.questionType === "coding") && (
                    <Textarea
                      placeholder={
                        currentQ.questionType === "coding"
                          ? "// write your code here..."
                          : "Type your answer here..."
                      }
                      value={answers[currentQ._id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(currentQ._id, e.target.value)
                      }
                      className={`min-h-[200px] ${
                        currentQ.questionType === "coding" ? "font-mono" : ""
                      }`}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={previousQuestion}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  {currentQuestion === questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={submitMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {submitMutation.isPending
                        ? "Submitting..."
                        : "Submit Exam"}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextQuestion}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Webcam Feed */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                  <video
                    ref={webcamRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {webcamActive && (
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white">
                      <Camera className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                  )}
                </div>
                <div className="p-3 border-t">
                  <p className="text-xs font-medium text-gray-700">
                    Laptop Webcam
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Front camera recording
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Phone Camera QR Code */}
            {showQrCode && qrCode && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-sm">
                        Connect Phone Camera
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQrCode(false)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="bg-white p-3 rounded-lg mb-3">
                    <img src={qrCode} alt="QR Code" className="w-full h-auto" />
                  </div>

                  <div className="space-y-1 text-xs text-gray-700">
                    <p className="flex items-center gap-1">
                      <span className="font-semibold">1.</span> Scan QR code
                      with your phone
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="font-semibold">2.</span> Allow camera
                      access
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="font-semibold">3.</span> Position phone
                      behind you
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="font-semibold">4.</span> Keep connected
                      throughout exam
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Monitoring */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">Live Monitoring</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Laptop Webcam</span>
                    <Badge
                      variant={webcamActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {webcamActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      Phone Camera (360° View)
                    </span>
                    <Badge
                      variant={phoneActive ? "default" : "outline"}
                      className="text-xs"
                    >
                      {phoneActive ? "Connected" : "No connection"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Detection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <h3 className="font-semibold text-sm">AI Detection Status</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Face Detection</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Multiple Persons</span>
                    <span className="text-green-600 font-medium">None</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tab Switches</span>
                    <span className="text-gray-900 font-medium">
                      {alerts.filter((a) => a.type === "tab_switch").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Suspicious Movement</span>
                    <span className="text-green-600 font-medium">None</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            {alerts.length > 0 && (
              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <h3 className="font-semibold text-sm">
                      Activity Log ({alerts.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {alerts
                      .slice(-5)
                      .reverse()
                      .map((alert, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 bg-orange-50 rounded border border-orange-200"
                        >
                          <div className="font-medium text-orange-900 capitalize">
                            {alert.type.replace(/_/g, " ")}
                          </div>
                          <div className="text-orange-600">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
