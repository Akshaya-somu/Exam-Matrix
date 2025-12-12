import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, UserX, CheckCircle, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

interface ProctorFeedProps {
  studentName: string;
  status: "active" | "suspicious" | "absent" | "multiple_faces";
  imageSrc?: string; // Optional real image, otherwise placeholder
  confidence: number;
  devices: number;
}

export function ProctorFeed({ studentName, status, confidence, devices }: ProctorFeedProps) {
  const statusConfig = {
    active: { color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle, label: "Clean" },
    suspicious: { color: "bg-orange-500/10 text-orange-600 border-orange-200", icon: AlertTriangle, label: "Suspicious" },
    absent: { color: "bg-red-500/10 text-red-600 border-red-200", icon: UserX, label: "Absent" },
    multiple_faces: { color: "bg-red-500/10 text-red-600 border-red-200", icon: UsersIcon, label: "Multiple Faces" },
  };

  const config = statusConfig[status] || statusConfig.active;
  const Icon = config.icon;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 group hover:shadow-md",
      status === "suspicious" || status === "multiple_faces" ? "ring-2 ring-destructive/50" : "hover:border-primary/50"
    )}>
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {/* Mock Video Feed Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800" />
        
        {/* Mock Face Detection Box */}
        {status !== "absent" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute w-32 h-40 border-2 border-primary/40 rounded-lg flex flex-col items-center justify-between pb-2"
          >
            <div className="w-full flex justify-between px-1 pt-1">
               <span className="text-[10px] text-primary/70 font-mono">{(confidence * 100).toFixed(0)}%</span>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            {/* Crosshair corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary" />
          </motion.div>
        )}

        {/* User Avatar Placeholder */}
        <div className="z-10 text-muted-foreground/30">
          <Icon className="w-12 h-12" />
        </div>

        {/* Status Overlay */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className={cn("bg-white/80 backdrop-blur-sm shadow-sm", config.color)}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        
        {/* Device Icon if phone detected */}
        {devices > 1 && (
           <div className="absolute top-3 left-3">
            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-blue-600 border-blue-200">
              <Smartphone className="w-3 h-3 mr-1" />
              Phone
            </Badge>
           </div>
        )}
      </div>

      <div className="p-3 border-t bg-card flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm text-foreground">{studentName}</h3>
          <p className="text-xs text-muted-foreground">ID: 8824{(Math.random()*1000).toFixed(0)}</p>
        </div>
        <div className="flex gap-2">
           <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
             <div 
               className={cn("h-full rounded-full", status === "active" ? "bg-green-500" : "bg-red-500")} 
               style={{ width: `${confidence * 100}%` }} 
             />
           </div>
        </div>
      </div>
    </Card>
  );
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
