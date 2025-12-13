import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Monitor, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function AdminDashboard() {
  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => apiRequest("/api/students"),
  });

  const { data: exams } = useQuery({
    queryKey: ["exams"],
    queryFn: () => apiRequest("/api/exams"),
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiRequest("/api/sessions"),
  });

  const stats = [
    {
      title: "Total Students",
      value: students?.length || 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Total Exams",
      value: exams?.length || 0,
      icon: FileText,
      color: "bg-green-500",
    },
    {
      title: "Active Sessions",
      value: sessions?.filter((s: any) => s.status === "active").length || 0,
      icon: Monitor,
      color: "bg-purple-500",
    },
    {
      title: "Flagged Sessions",
      value: sessions?.filter((s: any) => s.status === "flagged").length || 0,
      icon: AlertTriangle,
      color: "bg-red-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your exam system</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Exams</CardTitle>
            </CardHeader>
            <CardContent>
              {exams && exams.length > 0 ? (
                <div className="space-y-3">
                  {exams.slice(0, 5).map((exam: any) => (
                    <div
                      key={exam._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{exam.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(exam.startAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          exam.status === "live"
                            ? "bg-green-100 text-green-700"
                            : exam.status === "upcoming"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {exam.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No exams found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Students</CardTitle>
            </CardHeader>
            <CardContent>
              {students && students.length > 0 ? (
                <div className="space-y-3">
                  {students.slice(0, 5).map((student: any) => (
                    <div
                      key={student._id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No students found
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
