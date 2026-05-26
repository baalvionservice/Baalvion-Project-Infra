import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, ChevronDown, Activity } from "lucide-react";

const services = [
  { name: "Residential Network", status: "operational", uptime: "99.99%" },
  { name: "Mobile Network", status: "operational", uptime: "99.95%" },
  { name: "Datacenter Network", status: "operational", uptime: "100%" },
  { name: "API Gateway", status: "operational", uptime: "99.99%" },
  { name: "Dashboard", status: "operational", uptime: "99.99%" },
  { name: "Auth Services", status: "operational", uptime: "100%" },
];

export function StatusBar() {
  const [open, setOpen] = useState(false);
  const allOperational = services.every((s) => s.status === "operational");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary/50 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${allOperational ? "bg-success animate-pulse" : "bg-warning animate-pulse"}`} />
        <span className="text-muted-foreground hidden sm:inline">
          {allOperational ? "All systems operational" : "Degraded performance"}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              System Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{s.uptime}</span>
                  <Badge variant="success" className="text-xs">Operational</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center pt-2">
            <a href="/status" className="text-sm text-primary hover:underline">View full status page →</a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}