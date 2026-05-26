
"use client";

import { ActivityLog } from "@/lib/capital-ops/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Clock, ArrowRight } from "lucide-react";

interface ActivityLogPanelProps {
  logs: ActivityLog[];
}

export function ActivityLogPanel({ logs }: ActivityLogPanelProps) {
  return (
    <div className="h-full flex flex-col bg-card/30 border-l border-border/50">
      <div className="p-6 border-b border-border/50 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-sm uppercase tracking-widest tracking-[0.2em]">Compliance Ledger</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {logs.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground italic">
              No lifecycle actions recorded.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="text-[11px] leading-relaxed group animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono text-[9px]">{log.timestamp}</span>
                  <span className="text-primary font-bold uppercase tracking-tighter">{log.role}</span>
                </div>
                <div className="pl-5 border-l border-primary/20 flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground opacity-50" />
                  <span className="text-foreground/80 font-medium">{log.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border/50 bg-background/50">
        <p className="text-[9px] text-muted-foreground uppercase leading-tight font-bold tracking-tighter">
          SEC-RULE 17A-4: ALL CAPITAL MOTIONS ARE IMMUTABLY RECORDED.
        </p>
      </div>
    </div>
  );
}
