import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MonitorPlay, AlertTriangle, ShieldCheck, ArrowRight, Clock } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">Welcome back, Akshaya. Here's what's happening today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Exams"
            value="12"
            description="3 starting in the next hour"
            icon={MonitorPlay}
            trend="up"
            trendValue="+2"
          />
          <StatCard
            title="Students Online"
            value="1,248"
            description="98% attendance rate"
            icon={Users}
            trend="up"
            trendValue="+14%"
          />
          <StatCard
            title="Active Alerts"
            value="24"
            description="Requires attention"
            icon={AlertTriangle}
            trend="down"
            trendValue="-5%"
          />
          <StatCard
            title="System Status"
            value="99.9%"
            description="All systems operational"
            icon={ShieldCheck}
            trend="neutral"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 border-sidebar-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg">Active Sessions</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/exams">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "CS-101: Intro to Computer Science", students: 142, alerts: 5, status: "Live", time: "01:15:00" },
                  { name: "MATH-202: Linear Algebra", students: 89, alerts: 12, status: "Live", time: "00:45:30" },
                  { name: "BIO-105: General Biology", students: 210, alerts: 2, status: "Starting Soon", time: "10:00 AM" },
                  { name: "ENG-301: Advanced Composition", students: 56, alerts: 0, status: "Finished", time: "Ended 5m ago" },
                ].map((exam, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{exam.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" /> {exam.students} students
                        <span className="text-border">|</span>
                        <Clock className="w-3 h-3" /> {exam.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {exam.alerts > 0 && (
                        <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-[10px]">
                          {exam.alerts} Alerts
                        </Badge>
                      )}
                      <Badge variant={exam.status === "Live" ? "default" : "secondary"} className={
                        exam.status === "Live" ? "bg-green-500 hover:bg-green-600" : ""
                      }>
                        {exam.status}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                        <Link href="/session/1">
                           <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-sidebar-border shadow-sm bg-gradient-to-br from-card to-muted/20">
            <CardHeader>
              <CardTitle className="font-heading text-lg">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { label: "Face Detection API", status: "Operational", latency: "45ms" },
                  { label: "Video Streaming", status: "Operational", latency: "120ms" },
                  { label: "Database Sync", status: "Operational", latency: "12ms" },
                  { label: "AI Proctor Engine", status: "High Load", latency: "210ms" },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-mono",
                        item.status === "High Load" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                      )}>{item.status}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <div 
                         className={cn("h-full rounded-full", item.status === "High Load" ? "bg-orange-500" : "bg-green-500")}
                         style={{ width: item.status === "High Load" ? "85%" : "98%" }}
                       />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">Latency: {item.latency}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
