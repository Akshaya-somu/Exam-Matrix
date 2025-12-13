import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Eye,
  Camera,
  Smartphone,
  Clock,
  User,
  Flag,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import io from "socket.io-client";

export default function LiveMonitor() {
  const [socket, setSocket] = useState<any>(null);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: sessions, refetch } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: () => apiRequest("/api/sessions"),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const socketConnection = io("ws://localhost:3000/ws");
    setSocket(socketConnection);

    socketConnection.on("alert", (alert: any) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    socketConnection.on("session:update", () => {
      refetch();
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const activeSessions =
    sessions?.filter((s: any) => s.status === "active") || [];
  const flaggedSessions =
    sessions?.filter((s: any) => s.status === "flagged") || [];

  const flagSession = async (sessionId: string) => {
    try {
      await apiRequest(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "flagged" }),
      });
      refetch();
    } catch (error) {
      console.error("Failed to flag session:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Live Monitoring
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time exam proctoring dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Eye className="w-5 h-5 mr-2" />
              {activeSessions.length} Active
            </Badge>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {flaggedSessions.length} Flagged
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Sessions */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Exam Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {activeSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSessions.map((session: any) => (
                      <Card
                        key={session._id}
                        className={`cursor-pointer transition hover:shadow-lg ${
                          selectedSession === session._id
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
                        onClick={() => setSelectedSession(session._id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {session.studentId?.name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {session.studentId?.name || "Unknown"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {session.examId?.name}
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                              Live
                            </Badge>
                          </div>

                          {/* Camera Status */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1 text-gray-600">
                                <Camera className="w-3 h-3" />
                                Laptop
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Active
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1 text-gray-600">
                                <Smartphone className="w-3 h-3" />
                                Phone
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Active
                              </Badge>
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Started:{" "}
                              {new Date(session.startedAt).toLocaleTimeString()}
                            </span>
                          </div>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              flagSession(session._id);
                            }}
                            variant="destructive"
                            size="sm"
                            className="w-full"
                          >
                            <Flag className="w-3 h-3 mr-1" />
                            Flag Session
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No active sessions at the moment
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Detail View */}
            {selectedSession && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Detail - Live Feeds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-2">
                        <Camera className="w-12 h-12 text-gray-600" />
                      </div>
                      <p className="text-sm text-center text-gray-600">
                        Laptop Camera
                      </p>
                    </div>
                    <div>
                      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-2">
                        <Smartphone className="w-12 h-12 text-gray-600" />
                      </div>
                      <p className="text-sm text-center text-gray-600">
                        Phone Camera
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Live Alerts Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Live Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {liveAlerts.length > 0 ? (
                    liveAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-sm text-red-900 capitalize">
                            {alert.type?.replace(/_/g, " ")}
                          </span>
                          <Badge
                            variant={
                              alert.severity === "high"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          Session: {alert.sessionId?.slice(-6)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No alerts yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
