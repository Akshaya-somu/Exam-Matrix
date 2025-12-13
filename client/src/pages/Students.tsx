import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreHorizontal, Mail, Shield, GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Students() {
  const students = [
    { id: "8821", name: "Akshaya", email: "akshaya@example.com", major: "Computer Science", year: "Senior", status: "Active", gpa: "3.9" },
    { id: "8822", name: "Aasrith", email: "aasrith@example.com", major: "Information Tech", year: "Junior", status: "Warning", gpa: "3.5" },
    { id: "8823", name: "Harshitha", email: "harshitha@example.com", major: "Computer Science", year: "Senior", status: "Active", gpa: "3.8" },
    { id: "8824", name: "Deepthi", email: "deepthi@example.com", major: "Data Science", year: "Sophomore", status: "Probation", gpa: "2.8" },
    { id: "8825", name: "Krishna", email: "krishna@example.com", major: "Computer Eng", year: "Junior", status: "Active", gpa: "3.7" },
    { id: "8826", name: "Jyothi", email: "jyothi@example.com", major: "Computer Science", year: "Senior", status: "Active", gpa: "4.0" },
    { id: "8827", name: "Preethi", email: "preethi@example.com", major: "Information Tech", year: "Freshman", status: "Warning", gpa: "3.2" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold tracking-tight">Student Directory</h2>
            <p className="text-muted-foreground">Manage enrolled students and view academic profiles.</p>
          </div>
          <Button>
            <Shield className="w-4 h-4 mr-2" /> Register New Student
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enrolled Students ({students.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search students..." className="pl-9 h-9" />
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                      <AvatarFallback>{student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium leading-none">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                     <div className="flex items-center gap-2 w-32">
                       <GraduationCap className="w-4 h-4" />
                       {student.major}
                     </div>
                     <div className="w-20">
                       {student.year}
                     </div>
                     <div className="w-16">
                       GPA: {student.gpa}
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={
                      student.status === "Active" ? "default" :
                      student.status === "Warning" ? "secondary" : "destructive"
                    } className={
                      student.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-200" :
                      student.status === "Warning" ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : ""
                    }>
                      {student.status}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Academic Record</DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" /> Email Student
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Suspend Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
