import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, XCircle, Clock, CheckCircle } from "lucide-react";
import { useAdminProviders } from "@/hooks/useAdmin";

const issueTypeLabels: Record<string, string> = {
  latency_spike: "Latency Spike",
  block_rate: "Block Rate",
  provider_outage: "Provider Outage",
  increased_latency: "Increased Latency",
  open: "Active Incident",
};

const severityConfig: Record<string, { variant: "warning" | "destructive" | "secondary"; icon: typeof AlertTriangle }> = {
  low: { variant: "secondary", icon: AlertCircle },
  medium: { variant: "warning", icon: AlertTriangle },
  high: { variant: "destructive", icon: XCircle },
  critical: { variant: "destructive", icon: XCircle },
};

interface CountryAlertsPanelProps {
  compact?: boolean;
  maxAlerts?: number;
}

export function CountryAlertsPanel({ compact = false, maxAlerts = 5 }: CountryAlertsPanelProps) {
  const { data: providers = [] } = useAdminProviders();

  // Derive alerts from real provider status — degraded providers become latency alerts,
  // inactive/down providers become outage alerts.
  const allAlerts = providers
    .filter(p => p.status === "degraded" || p.status === "inactive" || p.status === "down")
    .map(p => {
      const isDown = p.status === "down" || p.status === "inactive";
      return {
        id: `alert-${p.id}`,
        country: p.name,
        countryCode: "?",
        issueType: isDown ? "provider_outage" : "latency_spike",
        severity: isDown ? ("high" as const) : ("medium" as const),
        timestamp: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "Now",
        status: "active" as const,
        message: isDown
          ? `${p.name} is currently down`
          : `${p.name} is experiencing degraded performance`,
      };
    });
  const displayAlerts = maxAlerts ? allAlerts.slice(0, maxAlerts) : allAlerts;
  const activeCount = allAlerts.filter(a => a.status === "active").length;

  return (
    <Card variant={compact ? "stats" : "default"}>
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? "text-base" : "text-lg"}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Country Alerts
            </div>
          </CardTitle>
          {activeCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {activeCount} Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-2" : "space-y-3"}>
        {displayAlerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          displayAlerts.map(alert => {
            const severity = severityConfig[alert.severity] ?? severityConfig.medium;
            const SeverityIcon = severity.icon;
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  alert.status === "active"
                    ? "bg-destructive/5 border border-destructive/20"
                    : "bg-secondary/30"
                }`}
              >
                <div className="text-xl">🌍</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{alert.country}</span>
                    <Badge variant={severity.variant} className="text-xs gap-1">
                      <SeverityIcon className="w-3 h-3" />
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {issueTypeLabels[alert.issueType] ?? alert.issueType}
                  </p>
                  {!compact && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{alert.message}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={alert.status === "active" ? "destructive" : "success"} className="text-xs">
                    {alert.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {alert.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
