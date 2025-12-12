import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Reports() {
  const data = [
    { name: "Clean", value: 85, color: "hsl(142 71% 45%)" },
    { name: "Minor Flags", value: 10, color: "hsl(47 95% 49%)" },
    { name: "High Suspicion", value: 5, color: "hsl(0 84% 60%)" },
  ];

  const timeData = [
    { time: "0-15m", alerts: 12 },
    { time: "15-30m", alerts: 45 },
    { time: "30-45m", alerts: 23 },
    { time: "45-60m", alerts: 8 },
  ];

  const students = [
    { name: "James Wilson", id: "8821", score: 92, status: "Clean", flags: 0 },
    { name: "Sarah Chen", id: "8822", score: 88, status: "Review", flags: 3 },
    { name: "Alex Morgan", id: "8823", score: 45, status: "Flagged", flags: 12 },
    { name: "Emily Davis", id: "8824", score: 78, status: "Clean", flags: 1 },
    { name: "Michael Brown", id: "8825", score: 85, status: "Clean", flags: 0 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold tracking-tight">Exam Reports</h2>
            <p className="text-muted-foreground">Analysis for CS-101: Intro to Computer Science</p>
          </div>
          <div className="flex items-center gap-3">
             <Select defaultValue="cs101">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs101">CS-101 (Today)</SelectItem>
                  <SelectItem value="math202">MATH-202 (Yesterday)</SelectItem>
                </SelectContent>
             </Select>
             <Button variant="outline">
               <Download className="w-4 h-4 mr-2" /> Export PDF
             </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Integrity Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">+2% from last semester</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flags Raised</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">88</div>
              <p className="text-xs text-muted-foreground">Mostly "Looking Away" events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42m 15s</div>
              <p className="text-xs text-muted-foreground">Fastest: 28m • Slowest: 59m</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
           <Card>
             <CardHeader>
               <CardTitle>Integrity Distribution</CardTitle>
               <CardDescription>Breakdown of student session statuses</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={data}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {data.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="flex justify-center gap-6 text-sm">
                 {data.map((item, i) => (
                   <div key={i} className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                     <span className="text-muted-foreground">{item.name}</span>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle>Alert Timeline</CardTitle>
               <CardDescription>Frequency of suspicious activities over exam duration</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={timeData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
                     <YAxis tickLine={false} axisLine={false} fontSize={12} />
                     <Tooltip 
                       cursor={{ fill: 'transparent' }}
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     />
                     <Bar dataKey="alerts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Detailed List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Performance Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                      student.status === "Flagged" ? "bg-red-100 text-red-700" :
                      student.status === "Review" ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    )}>
                      {student.name.charAt(0)}{student.name.split(' ')[1].charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                       <p className="text-xs text-muted-foreground">Flags</p>
                       <p className={cn("font-bold", student.flags > 0 ? "text-destructive" : "text-foreground")}>
                         {student.flags}
                       </p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-muted-foreground">Score</p>
                       <p className="font-bold">{student.score}%</p>
                    </div>
                    <Badge variant={
                      student.status === "Flagged" ? "destructive" : 
                      student.status === "Review" ? "secondary" : "default"
                    } className={
                      student.status === "Review" ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : 
                      student.status === "Clean" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""
                    }>
                      {student.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </Button>
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
