import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Users,
  AlertTriangle,
  CheckCircle,
  Video,
  Clock,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useLocation } from "wouter";

export default function ProctorDashboard() {
  const [, setLocation] = useLocation();

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiRequest("/api/sessions"),
  });

  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: () => apiRequest("/api/exams"),
  });

  const activeSessions =
    sessions?.filter((s: any) => s.status === "active") || [];
  const flaggedSessions =
    sessions?.filter((s: any) => s.status === "flagged") || [];

  const stats = [
    {
      title: "Active Sessions",
      value: activeSessions.length,
      icon: Monitor,
      color: "bg-green-500",
    },
    {
      title: "Total Sessions",
      value: sessions?.length || 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Flagged",
      value: flaggedSessions.length,
      icon: AlertTriangle,
      color: "bg-red-500",
    },
    {
      title: "Completed",
      value: sessions?.filter((s: any) => s.status === "completed").length || 0,
      icon: CheckCircle,
      color: "bg-gray-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Proctor Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Monitor ongoing exams</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.color} p-2 rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Active Exams - Live Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No exams available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam: any) => {
                  const examSessions =
                    sessions?.filter(
                      (s: any) =>
                        s.examId?._id === exam._id && s.status === "active"
                    ) || [];

                  return (
                    <Card
                      key={exam._id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg truncate">
                              {exam.title || exam.name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {exam.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>{examSessions.length} active</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{exam.durationMinutes || 60} min</span>
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            onClick={() =>
                              setLocation(`/proctor/monitor/${exam._id}`)
                            }
                          >
                            <Monitor className="w-4 h-4 mr-2" />
                            Monitor Exam
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {flaggedSessions.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Flagged Sessions Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {flaggedSessions.map((session: any) => (
                  <div
                    key={session._id}
                    className="p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {session.examId?.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Student: {session.studentId?.name}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
                        FLAGGED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
