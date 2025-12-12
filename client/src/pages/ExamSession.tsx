import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProctorFeed } from "@/components/dashboard/ProctorFeed";
import { AlertList } from "@/components/dashboard/AlertList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Grid, List, Filter, PlayCircle, PauseCircle, Phone } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ExamSession() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const students = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    name: ["Alex Morgan", "Sarah Chen", "James Wilson", "Emily Davis", "Michael Brown", "Lisa Wang", "David Miller", "Jessica Taylor", "Ryan Cooper", "Emma White", "Daniel Lee", "Olivia Martin"][i],
    status: i === 1 ? "suspicious" : i === 4 ? "absent" : i === 7 ? "multiple_faces" : "active",
    confidence: 0.85 + Math.random() * 0.14,
    devices: i === 1 ? 2 : 1
  }));

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* Main Feed Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-heading font-bold">CS-101: Intro to Computer Science</h2>
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium border border-green-200 animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-muted-foreground text-sm">Time Remaining: 01:14:32</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search student..." className="pl-9 h-9" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] h-9">
                  <Filter className="w-3.5 h-3.5 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <div className="border-l pl-2 ml-2 flex gap-1">
                <Button 
                  variant={viewMode === "grid" ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pb-10">
              {students.map((student: any) => (
                <ProctorFeed 
                  key={student.id}
                  studentName={student.name}
                  status={student.status}
                  confidence={student.confidence}
                  devices={student.devices}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between shadow-sm">
             <div className="flex gap-4 text-sm text-muted-foreground">
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> 138 Active</span>
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> 3 Suspicious</span>
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> 1 Absent</span>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" className="h-8">
                 <PauseCircle className="w-4 h-4 mr-2" />
                 Pause Exam
               </Button>
               <Button variant="destructive" size="sm" className="h-8">
                 End Session
               </Button>
             </div>
          </div>
        </div>

        {/* Sidebar Alerts */}
        <aside className="w-80 shrink-0">
          <AlertList />
        </aside>
      </div>
    </DashboardLayout>
  );
}
