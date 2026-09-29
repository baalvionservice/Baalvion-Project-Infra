
"use client";

import { InstitutionalAlert } from "@/types/intelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertTriangle, ShieldCheck, DollarSign, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertsPanelProps {
  alerts: InstitutionalAlert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'CapitalCall': return <DollarSign className="h-4 w-4 text-primary" />;
      case 'NAVUpdate': return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case 'Audit': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'Distribution': return <DollarSign className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-card/30 border-border/50 h-full flex flex-col">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Institutional Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="divide-y divide-border/50">
          {alerts.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground italic">
              No alerts active for your current clearance level.
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={cn(
                  "p-4 hover:bg-primary/5 transition-colors group relative",
                  alert.status === 'Unread' && "bg-primary/5"
                )}
              >
                {alert.status === 'Unread' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-background border border-border/50 shadow-sm">
                      {getIcon(alert.type)}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">
                      {alert.type}
                    </span>
                  </div>
                  <Badge 
                    variant={alert.priority === 'High' ? 'destructive' : alert.priority === 'Medium' ? 'default' : 'outline'}
                    className="text-[8px] h-4 py-0"
                  >
                    {alert.priority}
                  </Badge>
                </div>
                <p className="text-xs font-medium leading-relaxed mb-2 text-foreground/90">
                  {alert.message}
                </p>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono">
                  <Clock className="h-3 w-3" />
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
