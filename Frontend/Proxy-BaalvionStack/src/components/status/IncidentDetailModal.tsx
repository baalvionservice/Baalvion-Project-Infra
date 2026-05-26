import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IncidentDetail } from "@/types/admin";
import { Clock, Globe, Server, CheckCircle, AlertCircle, Search, Eye } from "lucide-react";

interface IncidentDetailModalProps {
  incident: IncidentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { variant: "success" | "warning" | "secondary" | "destructive"; icon: typeof CheckCircle; label: string }> = {
  investigating: { variant: "destructive", icon: Search, label: "Investigating" },
  identified: { variant: "warning", icon: AlertCircle, label: "Identified" },
  monitoring: { variant: "secondary", icon: Eye, label: "Monitoring" },
  resolved: { variant: "success", icon: CheckCircle, label: "Resolved" },
};

export function IncidentDetailModal({ incident, open, onOpenChange }: IncidentDetailModalProps) {
  if (!incident) return null;

  const status = statusConfig[incident.status];
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl pr-4">{incident.title}</DialogTitle>
              <DialogDescription className="mt-2">{incident.summary}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status and Duration */}
          <div className="flex items-center gap-4">
            <Badge variant={status.variant} className="gap-1 text-sm">
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Duration: {incident.duration}
            </div>
          </div>

          {/* Timeframe */}
          <Card variant="stats">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Started</p>
                  <p className="font-medium">{incident.startTime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ended</p>
                  <p className="font-medium">{incident.endTime || "Ongoing"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affected Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              Affected Proxy Types
            </h4>
            <div className="flex flex-wrap gap-2">
              {incident.affectedProxyTypes.map((type) => (
                <Badge key={type} variant="muted">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Affected Countries */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Affected Countries
            </h4>
            <div className="flex flex-wrap gap-2">
              {incident.affectedCountries.map((country) => (
                <Badge key={country} variant="secondary">
                  {country}
                </Badge>
              ))}
            </div>
          </div>

          {/* Resolution Notes */}
          {incident.resolutionNotes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Resolution Notes</h4>
              <Card variant="glass">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{incident.resolutionNotes}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Incident Timeline</h4>
            <div className="space-y-3">
              {incident.updates.map((update, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    {index < incident.updates.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">{update.time}</p>
                    <p className="text-sm">{update.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
