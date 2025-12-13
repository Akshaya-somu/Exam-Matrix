import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ExamCamera from "@/components/ExamCamera";
import { AlertTriangle, Clock, Eye, CheckCircle, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { DetectionService } from "@/lib/detection";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import io from "socket.io-client";

export default function TakeExam() {
  const [, params] = useRoute("/student/exam/:examId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const detectionService = useRef(new DetectionService());
  const socketRef = useRef<any>(null);
  const { toast } = useToast();
  const hasCreatedSession = useRef(false);

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam", params?.examId],
    queryFn: () => apiRequest(`/api/exams/${params?.examId}`),
    enabled: !!params?.examId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", params?.examId],
    queryFn: () => apiRequest(`/api/exams/${params?.examId}/questions`),
    enabled: !!params?.examId,
  });

  useEffect(() => {
    if (exam && !hasCreatedSession.current) {
      hasCreatedSession.current = true;
      createSession();
      enterFullscreen();
      setupDetection();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      exitFullscreen();
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

      socketRef.current = io("/", { path: "/ws" });
      socketRef.current.on("connect", () => {
        console.log("Connected to WebSocket");
        socketRef.current.emit("join", session._id);
      });
    } catch (error) {
      console.error("Session creation error:", error);
      toast({
        title: "Error",
        description: "Failed to start exam session",
        variant: "destructive",
      });
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

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(console.error);
    setIsFullscreen(true);
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
    setIsFullscreen(false);
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
      exitFullscreen();
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progress = exam
    ? ((exam.durationMinutes * 60 - timeRemaining) /
        (exam.durationMinutes * 60)) *
      100
    : 0;

  if (examLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-white">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Exam not found</h1>
          <Button onClick={() => setLocation("/student/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 rounded-lg p-4 mb-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{exam.name}</h1>
            <p className="text-gray-400 text-sm">
              Session ID: {sessionId || "Initializing..."}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-gray-400">Time Remaining</div>
            </div>
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={submitMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? "Submitting..." : "Submit Exam"}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="mt-3 h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ExamCamera
              sessionId={sessionId}
              type="laptop"
              onAlert={handleAlert}
            />
            <ExamCamera
              sessionId={sessionId}
              type="phone"
              onAlert={handleAlert}
            />
          </div>

          <Alert className="bg-blue-900 border-blue-700">
            <Eye className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Keep both cameras on at all times. The
              laptop camera should capture your face, and the phone camera
              should be placed beside you to capture your workspace.
            </AlertDescription>
          </Alert>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Exam Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions && questions.length > 0 ? (
                questions.map((question: any, index: number) => (
                  <div key={question._id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-lg font-medium">
                            {question.questionText}
                          </p>
                          <span className="text-sm text-gray-400">
                            {question.points} points
                          </span>
                        </div>
                        <Textarea
                          placeholder="Type your answer here..."
                          value={answers[question._id] || ""}
                          onChange={(e) =>
                            handleAnswerChange(question._id, e.target.value)
                          }
                          className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No questions available for this exam
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Proctoring Active
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span className="text-sm">Laptop Camera</span>
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span className="text-sm">Phone Camera</span>
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Active
                </span>
              </div>
            </CardContent>
          </Card>

          {alerts.length > 0 && (
            <Card className="bg-red-900 border-red-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Warnings ({alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {alerts
                    .slice(-5)
                    .reverse()
                    .map((alert, idx) => (
                      <div key={idx} className="p-2 bg-red-800 rounded text-sm">
                        <div className="font-medium capitalize">
                          {alert.type.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-gray-300">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Exam Rules</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 space-y-2">
              <p>• Keep both cameras on</p>
              <p>• Do not switch tabs</p>
              <p>• Do not leave the exam window</p>
              <p>• Only one person should be visible</p>
              <p>• No phones or external devices</p>
              <p>• Stay in your seat throughout</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
