import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, trendValue }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-sidebar-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold font-heading">{value}</h2>
              {trend && (
                <span className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded-full",
                  trend === "up" ? "bg-green-100 text-green-700" : 
                  trend === "down" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                )}>
                  {trendValue}
                </span>
              )}
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          {description}
        </div>
      </CardContent>
    </Card>
  );
}
