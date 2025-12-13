import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, PlayCircle, Video } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { data: exams } = useQuery({
    queryKey: ["exams"],
    queryFn: () => apiRequest("/api/exams"),
  });

  const upcomingExams =
    exams?.filter((e: any) => e.status === "upcoming") || [];
  const liveExams = exams?.filter((e: any) => e.status === "live") || [];

  const startExam = (examId: string) => {
    setLocation(`/student/exam/${examId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Student Dashboard
          </h1>
          <p className="text-gray-600 mt-1">View and take your exams</p>
        </div>

        {/* Camera Setup Instructions */}
        <Alert className="bg-blue-50 border-blue-200">
          <Video className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Before starting an exam:</strong> Ensure you have your
            laptop camera enabled and a phone camera set up beside you to
            capture your workspace. Both cameras must remain on during the
            entire exam.
          </AlertDescription>
        </Alert>

        {liveExams.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-green-600 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              Live Exams - Start Now!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveExams.map((exam: any) => (
                <Card key={exam._id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{exam.name}</span>
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE NOW
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-700">
                        <Clock className="w-4 h-4 mr-2" />
                        Duration: {exam.durationMinutes} minutes
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        Started: {new Date(exam.startAt).toLocaleString()}
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Video className="w-4 h-4 mr-2" />
                        Dual camera proctoring enabled
                      </div>
                    </div>
                    <Button
                      onClick={() => startExam(exam._id)}
                      className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Start Exam Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-4">Upcoming Exams</h2>
          {upcomingExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingExams.map((exam: any) => (
                <Card key={exam._id}>
                  <CardHeader>
                    <CardTitle>{exam.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(exam.startAt).toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {exam.durationMinutes} minutes
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Video className="w-4 h-4 mr-2" />
                      Proctored exam
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                      Starts Soon
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No upcoming exams scheduled
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
