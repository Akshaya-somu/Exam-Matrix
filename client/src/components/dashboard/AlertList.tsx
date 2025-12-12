import { AlertCircle, Eye, MonitorOff, UserX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "tab_switch" | "multiple_faces" | "absent" | "phone_detected";
  studentName: string;
  time: string;
  severity: "high" | "medium" | "low";
}

const mockAlerts: Alert[] = [
  { id: "1", type: "multiple_faces", studentName: "Alex Morgan", time: "Just now", severity: "high" },
  { id: "2", type: "phone_detected", studentName: "Sarah Chen", time: "2m ago", severity: "high" },
  { id: "3", type: "tab_switch", studentName: "James Wilson", time: "5m ago", severity: "medium" },
  { id: "4", type: "absent", studentName: "Emily Davis", time: "12m ago", severity: "low" },
];

export function AlertList() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="font-heading font-semibold text-foreground">Live Alerts</h3>
        <span className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
          {mockAlerts.length} New
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {mockAlerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 w-2 h-2 rounded-full",
                  alert.severity === "high" ? "bg-destructive animate-pulse" : 
                  alert.severity === "medium" ? "bg-orange-500" : "bg-yellow-500"
                )} />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-foreground">{alert.studentName}</p>
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {alert.type === "multiple_faces" && <><Eye className="w-3 h-3" /> Multiple faces detected</>}
                    {alert.type === "phone_detected" && <><AlertCircle className="w-3 h-3" /> Unauthorized device</>}
                    {alert.type === "tab_switch" && <><MonitorOff className="w-3 h-3" /> Tab switch detected</>}
                    {alert.type === "absent" && <><UserX className="w-3 h-3" /> Student absent</>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
