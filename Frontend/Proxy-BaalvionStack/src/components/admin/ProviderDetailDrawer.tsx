import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Provider } from "@/types/admin";

const countryFlags: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", JP: "🇯🇵",
  NL: "🇳🇱", AU: "🇦🇺", CA: "🇨🇦", BR: "🇧🇷", MX: "🇲🇽",
  IN: "🇮🇳", SG: "🇸🇬", KR: "🇰🇷", IT: "🇮🇹", ES: "🇪🇸",
};
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { CheckCircle, AlertTriangle, XCircle, Clock, Globe } from "lucide-react";

interface ProviderDetailDrawerProps {
  provider: Provider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle }> = {
  healthy: { variant: "success", icon: CheckCircle },
  degraded: { variant: "warning", icon: AlertTriangle },
  down: { variant: "destructive", icon: XCircle },
};

export function ProviderDetailDrawer({ provider, open, onOpenChange }: ProviderDetailDrawerProps) {
  if (!provider) return null;

  const status = statusConfig[provider.status];
  const StatusIcon = status.icon;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-4xl overflow-y-auto">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-xl">{provider.name}</DrawerTitle>
                <DrawerDescription>Provider details and performance metrics</DrawerDescription>
              </div>
              <Badge variant={status.variant} className="gap-1 text-sm">
                <StatusIcon className="w-4 h-4" />
                {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
              </Badge>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card variant="stats">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{provider.avgLatency}ms</p>
                  <p className="text-xs text-muted-foreground">Avg Latency</p>
                </CardContent>
              </Card>
              <Card variant="stats">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${provider.successRate >= 98 ? "text-success" : provider.successRate >= 95 ? "text-warning" : "text-destructive"}`}>
                    {provider.successRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </CardContent>
              </Card>
              <Card variant="stats">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{provider.supportedCountries.length}</p>
                  <p className="text-xs text-muted-foreground">Countries</p>
                </CardContent>
              </Card>
            </div>

            {/* Country Coverage */}
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Country Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {provider.supportedCountries.map((code) => (
                    <Badge key={code} variant="muted" className="text-sm gap-1">
                      {countryFlags[code] || "🌍"} {code}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Latency Trend */}
              <Card variant="default">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Latency Trend (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={provider.latencyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}ms`, "Latency"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="latency"
                          stroke="hsl(199, 89%, 48%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate Trend */}
              <Card variant="default">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Success Rate Trend (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={provider.successTrend}>
                        <defs>
                          <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis domain={[90, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}%`, "Success Rate"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="rate"
                          stroke="hsl(142, 71%, 45%)"
                          strokeWidth={2}
                          fill="url(#successGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Incidents */}
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {provider.recentIncidents.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                    <p className="text-sm">No recent incidents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {provider.recentIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                incident.severity === "high"
                                  ? "destructive"
                                  : incident.severity === "medium"
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              {incident.severity}
                            </Badge>
                            <span className="font-medium text-sm">{incident.type}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{incident.startTime}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                        {incident.affectedCountries.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {incident.affectedCountries.map((code) => (
                              <span key={code} className="text-sm">
                                {countryFlags[code] || "🌍"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
