
"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { InvestorAlert } from "@/types/alerts";
import { INITIAL_ALERTS } from "@/lib/alerts-mock";
import { authService } from "@/core/services/auth.service";
import { UserRole } from "@/core/content/schemas";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Clock, ArrowRight, DollarSign, ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AlertsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertsSidebar({ open, onOpenChange }: AlertsSidebarProps) {
  const [alerts, setAlerts] = useState<InvestorAlert[]>([]);
  const [role, setRole] = useState<UserRole>('public');

  useEffect(() => {
    const loadAlerts = async () => {
      const { role: userRole } = await authService.getCurrentUser();
      setRole(userRole);
      
      // Filter alerts based on role
      const filtered = INITIAL_ALERTS.filter(a => 
        a.targetRoles.includes(userRole) || userRole === 'admin'
      );
      setAlerts(filtered);
    };

    if (open) loadAlerts();
  }, [open]);

  const getIcon = (category: string) => {
    switch (category) {
      case 'CapitalCall': return <DollarSign className="h-4 w-4 text-primary" />;
      case 'NAVUpdate': return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case 'Distribution': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'Governance': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border/50 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border/50 bg-muted/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <SheetTitle className="text-sm font-bold uppercase tracking-widest">Investor Alerts</SheetTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">{alerts.length} Total</Badge>
          </div>
          <SheetDescription className="text-xs pt-1">Institutional notifications for {role}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/50">
            {alerts.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground italic text-xs">
                No active notifications for your profile.
              </div>
            ) : (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={cn(
                    "p-6 hover:bg-primary/5 transition-colors group relative",
                    !alert.read && "bg-primary/5"
                  )}
                >
                  {!alert.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded bg-background border border-border/50 shadow-sm">
                      {getIcon(alert.category)}
                    </div>
                    <Badge 
                      variant={alert.priority === 'High' || alert.priority === 'Critical' ? 'destructive' : 'outline'}
                      className="text-[8px] h-4"
                    >
                      {alert.priority}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold leading-tight mb-1">{alert.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </div>
                    {alert.actionUrl && (
                      <Link 
                        href={alert.actionUrl} 
                        onClick={() => onOpenChange(false)}
                        className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                      >
                        Action <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 bg-background/50 text-[9px] text-center text-muted-foreground uppercase tracking-widest font-bold">
          SEC Rule 17a-4 Compliant Archive
        </div>
      </SheetContent>
    </Sheet>
  );
}
