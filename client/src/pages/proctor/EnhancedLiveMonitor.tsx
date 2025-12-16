import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Video,
  AlertTriangle,
  Users,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Ban,
  Play,
  Pause,
  Grid3x3,
  Grid2x2,
  Maximize2,
  Flag,
  StopCircle,
  MessageSquareWarning,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { apiClient } from "@/lib/api";

interface Student {
  id: string;
  name: string;
  email: string;
  status: "active" | "idle" | "suspicious" | "disconnected";
  videoStream?: MediaStream;
  alerts: number;
  lastActivity: string;
}

interface Alert {
  id: string;
  studentId: string;
  studentName: string;
  type: "tab_switch" | "multiple_faces" | "no_face" | "disconnected";
  severity: "low" | "medium" | "high";
  timestamp: string;
  description: string;
}

interface Session {
  _id: string;
  examId: {
    title: string;
    duration: number;
    endTime: string;
  };
  studentId: {
    name: string;
    email: string;
  };
  status: string;
  alerts: any[];
}

export default function EnhancedLiveMonitor() {
  const params = useParams<{ examId?: string }>();
  const examId = params?.examId;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [gridView, setGridView] = useState<"2x2" | "3x3">("3x3");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [peerConnections, setPeerConnections] = useState<
    Map<string, RTCPeerConnection>
  >(new Map());
  const videoRefs = useState<Map<string, HTMLVideoElement>>(new Map())[0];

  // Fetch exam sessions - all active sessions if no examId, or specific exam sessions
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: examId ? [`/api/sessions/exam/${examId}`] : ["/api/sessions"],
    refetchInterval: 5000,
    select: (data) => {
      // Filter active sessions only
      console.log("Sessions fetched:", data);
      const activeSessions = data.filter((s: any) => s.status === "active");
      console.log("Active sessions:", activeSessions);
      return activeSessions;
    },
  });

  // Fetch exam details
  const { data: exam } = useQuery({
    queryKey: [`/api/exams/${examId}`],
    enabled: !!examId,
  });

  // WebSocket connection
  useEffect(() => {
    const newSocket = io({
      path: "/ws",
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      newSocket.emit("proctor:join", { examId });
    });

    // Handle student stream ready notification
    newSocket.on(
      "student:stream:ready",
      async (data: {
        sessionId: string;
        studentId: string;
        socketId: string;
        studentName: string;
      }) => {
        console.log("Student stream ready:", data);

        // Request video stream from student
        newSocket.emit("proctor:request:stream", {
          studentId: data.socketId,
        });

        // Set up WebRTC peer connection
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });

        // Handle incoming video tracks
        peerConnection.ontrack = (event) => {
          console.log("Received remote track", event);
          const [remoteStream] = event.streams;

          setStudents((prev) =>
            prev.map((student) =>
              student.id === data.studentId || student.email === data.studentId
                ? { ...student, videoStream: remoteStream }
                : student
            )
          );

          // Attach stream to video element
          const videoElement = videoRefs.get(data.studentId);
          if (videoElement) {
            videoElement.srcObject = remoteStream;
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            newSocket.emit("webrtc:ice-candidate", {
              to: data.socketId,
              candidate: event.candidate,
            });
          }
        };

        // Handle WebRTC offer from student
        newSocket.on(
          "webrtc:offer",
          async (offerData: {
            from: string;
            offer: RTCSessionDescriptionInit;
            sessionId: string;
          }) => {
            if (offerData.sessionId === data.sessionId) {
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offerData.offer)
              );
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);

              newSocket.emit("webrtc:answer", {
                to: offerData.from,
                answer: answer,
              });
            }
          }
        );

        // Handle ICE candidates from student
        newSocket.on(
          "webrtc:ice-candidate",
          async (candidateData: {
            from: string;
            candidate: RTCIceCandidateInit;
          }) => {
            if (
              candidateData.from === data.socketId &&
              candidateData.candidate
            ) {
              await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidateData.candidate)
              );
            }
          }
        );

        setPeerConnections((prev) =>
          new Map(prev).set(data.studentId, peerConnection)
        );
      }
    );

    newSocket.on("alert", (data: any) => {
      const newAlert: Alert = {
        id: Date.now().toString(),
        studentId: data.studentId,
        studentName: data.studentName,
        type: data.type,
        severity: data.severity || "medium",
        timestamp: new Date().toISOString(),
        description: data.message,
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));

      // Update student status
      setStudents((prev) =>
        prev.map((student) =>
          student.id === data.studentId
            ? {
                ...student,
                status: "suspicious",
                alerts: student.alerts + 1,
              }
            : student
        )
      );
    });

    newSocket.on("student:status", (data: any) => {
      setStudents((prev) => {
        const existing = prev.find((s) => s.id === data.studentId);
        if (existing) {
          return prev.map((s) =>
            s.id === data.studentId
              ? {
                  ...s,
                  status: data.status,
                  lastActivity: new Date().toISOString(),
                }
              : s
          );
        }
        return [
          ...prev,
          {
            id: data.studentId,
            name: data.studentName,
            email: data.studentEmail,
            status: data.status,
            alerts: 0,
            lastActivity: new Date().toISOString(),
          },
        ];
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [examId]);

  // Re-join rooms when sessions change (for monitoring all exams)
  useEffect(() => {
    if (socket && !examId && sessions.length > 0) {
      sessions.forEach((session: Session) => {
        if (session.examId) {
          const sessionExamId =
            typeof session.examId === "object"
              ? (session.examId as any)._id
              : session.examId;
          socket.emit("proctor:join", { examId: sessionExamId });
        }
      });
    }
  }, [socket, sessions, examId]);

  // Initialize students from sessions data
  useEffect(() => {
    console.log("Sessions changed:", sessions);
    if (sessions.length > 0) {
      console.log("Initializing students from", sessions.length, "sessions");
      const studentsFromSessions: Student[] = sessions.map(
        (session: Session) => {
          const studentData = session.studentId as any;
          const existingStudent = students.find(
            (s) => s.id === session._id || s.id === studentData?._id
          );

          console.log("Processing session:", {
            sessionId: session._id,
            studentData,
            examId: session.examId,
          });

          return {
            id: session._id,
            name:
              studentData?.name || studentData?.username || "Unknown Student",
            email: studentData?.email || "",
            status: (session.status === "active" ? "active" : "idle") as
              | "active"
              | "idle"
              | "suspicious"
              | "disconnected",
            alerts: session.alerts?.length || 0,
            lastActivity: new Date().toISOString(),
            videoStream: existingStudent?.videoStream, // Preserve existing video stream
          };
        }
      );

      console.log("Setting students:", studentsFromSessions);
      setStudents(studentsFromSessions);

      // Request streams for all active students
      if (socket) {
        studentsFromSessions.forEach((student) => {
          socket.emit("proctor:request:stream", {
            studentId: student.id,
          });
        });
      }
    }
  }, [sessions, socket]);

  // Proctor action functions
  const sendWarning = async (studentId: string, studentName: string) => {
    if (!socket) return;

    socket.emit("proctor:warning", {
      studentId,
      examId,
      message: "Warning: Suspicious activity detected. Follow exam rules.",
    });

    const newAlert: Alert = {
      id: Date.now().toString(),
      studentId,
      studentName,
      type: "tab_switch",
      severity: "medium",
      timestamp: new Date().toISOString(),
      description: "Proctor issued warning",
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const pauseStudentExam = async (studentId: string, sessionId: string) => {
    if (!socket || !confirm("Pause this student's exam?")) return;

    socket.emit("proctor:pause", {
      studentId,
      sessionId,
      examId,
    });

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: "idle" } : s))
    );
  };

  const terminateStudentExam = async (
    studentId: string,
    sessionId: string,
    studentName: string
  ) => {
    if (
      !socket ||
      !confirm(`Terminate ${studentName}'s exam? This action cannot be undone.`)
    )
      return;

    socket.emit("proctor:terminate", {
      studentId,
      sessionId,
      examId,
      reason: "Terminated by proctor due to violations",
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: "disconnected" } : s
      )
    );
  };

  const flagStudent = (studentId: string, studentName: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: "suspicious" } : s))
    );

    const newAlert: Alert = {
      id: Date.now().toString(),
      studentId,
      studentName,
      type: "multiple_faces",
      severity: "high",
      timestamp: new Date().toISOString(),
      description: "Flagged by proctor for review",
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "suspicious":
        return "bg-red-500";
      case "idle":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "tab_switch":
        return <Ban className="h-4 w-4" />;
      case "multiple_faces":
        return <Users className="h-4 w-4" />;
      case "no_face":
        return <Eye className="h-4 w-4" />;
      case "disconnected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString();
  };

  const activeStudents = students.filter((s) => s.status === "active").length;
  const suspiciousStudents = students.filter(
    (s) => s.status === "suspicious"
  ).length;
  const totalAlerts = alerts.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading exam session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {examId ? exam?.title || "Live Proctoring" : "All Active Exams"}
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time monitoring and alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={gridView === "2x2" ? "default" : "outline"}
              size="sm"
              onClick={() => setGridView("2x2")}
            >
              <Grid2x2 className="h-4 w-4 mr-2" />
              2x2
            </Button>
            <Button
              variant={gridView === "3x3" ? "default" : "outline"}
              size="sm"
              onClick={() => setGridView("3x3")}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              3x3
            </Button>
            <Button
              variant={isPaused ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {activeStudents}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Suspicious</p>
                  <p className="text-2xl font-bold text-red-600">
                    {suspiciousStudents}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Alerts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {totalAlerts}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Video Grid */}
        <div className="lg:col-span-3">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Live Camera Feeds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`grid gap-4 ${
                  gridView === "3x3"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {students.map((student) => (
                  <Card
                    key={student.id}
                    className={`cursor-pointer transition-all ${
                      selectedStudent === student.id
                        ? "ring-2 ring-blue-500"
                        : ""
                    } ${
                      student.status === "suspicious"
                        ? "ring-2 ring-red-500"
                        : ""
                    }`}
                    onClick={() => setSelectedStudent(student.id)}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                        {/* Video stream */}
                        {student.videoStream ? (
                          <video
                            ref={(el) => {
                              if (el) {
                                videoRefs.set(student.id, el);
                                if (student.videoStream) {
                                  el.srcObject = student.videoStream;
                                }
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Avatar className="h-20 w-20 mx-auto mb-2">
                                <AvatarFallback className="text-2xl">
                                  {student.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm text-gray-400">
                                Waiting for video...
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={`${getStatusColor(
                              student.status
                            )} text-white`}
                          >
                            {student.status}
                          </Badge>
                        </div>

                        {/* Alert Count */}
                        {student.alerts > 0 && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="destructive">
                              {student.alerts} alerts
                            </Badge>
                          </div>
                        )}

                        {/* Fullscreen Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute bottom-2 right-2 text-white hover:text-white hover:bg-white/20"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="p-3">
                        <p className="font-semibold text-sm truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {student.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last seen: {formatTime(student.lastActivity)}
                        </p>

                        {/* Proctor Action Buttons */}
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendWarning(student.id, student.name);
                            }}
                          >
                            <MessageSquareWarning className="h-3 w-3 mr-1" />
                            Warn
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              pauseStudentExam(student.id, student.id);
                            }}
                          >
                            <StopCircle className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              terminateStudentExam(
                                student.id,
                                student.id,
                                student.name
                              );
                            }}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            End
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              flagStudent(student.id, student.name);
                            }}
                          >
                            <Flag className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {students.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students connected yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-white/80 backdrop-blur h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Live Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-2 p-4">
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      className={`${
                        alert.severity === "high"
                          ? "border-red-500"
                          : alert.severity === "medium"
                          ? "border-yellow-500"
                          : "border-blue-500"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`${getSeverityColor(
                            alert.severity
                          )} rounded-full p-1`}
                        >
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <AlertTitle className="text-sm font-semibold">
                            {alert.studentName}
                          </AlertTitle>
                          <AlertDescription className="text-xs">
                            {alert.description}
                          </AlertDescription>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                    </Alert>
                  ))}

                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No alerts yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
