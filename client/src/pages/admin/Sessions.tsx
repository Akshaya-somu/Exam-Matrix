import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function Sessions() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiRequest("/api/sessions"),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-gray-100 text-gray-700";
      case "flagged":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Sessions</h1>
          <p className="text-gray-600 mt-1">Monitor all exam sessions</p>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">Loading...</CardContent>
            </Card>
          ) : sessions && sessions.length > 0 ? (
            sessions.map((session: any) => (
              <Card key={session._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {session.examId?.name || "Unknown Exam"}
                    </CardTitle>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Student</div>
                      <div className="font-medium">
                        {session.studentId?.name || "Unknown"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Started At</div>
                      <div className="font-medium">
                        {session.startedAt
                          ? new Date(session.startedAt).toLocaleString()
                          : "Not started"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Status</div>
                      <div className="flex items-center gap-2">
                        {session.status === "flagged" && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        {session.status === "active" && (
                          <Monitor className="w-4 h-4 text-green-600" />
                        )}
                        <span className="font-medium capitalize">
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No sessions found
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
