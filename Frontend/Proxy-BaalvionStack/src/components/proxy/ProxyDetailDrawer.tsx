import { Proxy } from "@/types/proxy";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Clock,
  Globe,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

interface ProxyDetailDrawerProps {
  proxy: Proxy | null;
  open: boolean;
  onClose: () => void;
}

const statusConfig = {
  active: { label: "Active", color: "bg-success", icon: CheckCircle },
  maintenance: { label: "Maintenance", color: "bg-warning", icon: AlertTriangle },
  offline: { label: "Offline", color: "bg-destructive", icon: XCircle },
  limited: { label: "Limited", color: "bg-warning", icon: AlertTriangle },
};

const countryFlags: Record<string, string> = {
  US: "🇺🇸",
  GB: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  JP: "🇯🇵",
  NL: "🇳🇱",
};

export function ProxyDetailDrawer({ proxy, open, onClose }: ProxyDetailDrawerProps) {
  if (!proxy) return null;

  const status = statusConfig[proxy.status];
  const StatusIcon = status.icon;
  const flag = countryFlags[proxy.countryCode] || "🌍";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <span className="text-2xl">{flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span>{proxy.city}, {proxy.country}</span>
                <Badge
                  variant={proxy.status === "active" ? "outline" : proxy.status === "offline" ? "destructive" : "secondary"}
                  className="gap-1"
                >
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                {proxy.type} Proxy • {proxy.protocol}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card variant="stats" className="p-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Success Rate</span>
              </div>
              <p className="text-xl font-bold text-success mt-1">{proxy.successRate}%</p>
            </Card>
            <Card variant="stats" className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Avg Latency</span>
              </div>
              <p className="text-xl font-bold mt-1">{proxy.avgLatency}ms</p>
            </Card>
            <Card variant="stats" className="p-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Uptime</span>
              </div>
              <p className="text-xl font-bold mt-1">{proxy.uptime}%</p>
            </Card>
            <Card variant="stats" className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Requests</span>
              </div>
              <p className="text-xl font-bold mt-1">{(proxy.totalRequests / 1000).toFixed(1)}K</p>
            </Card>
          </div>

          {/* Bandwidth Usage */}
          <Card variant="default" className="mb-6">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Bandwidth Usage</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {proxy.bandwidthUsed} MB / {proxy.bandwidthLimit} MB
                </span>
                <span className="text-sm font-medium">
                  {((proxy.bandwidthUsed / proxy.bandwidthLimit) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    proxy.bandwidthUsed / proxy.bandwidthLimit > 0.9
                      ? "bg-destructive"
                      : proxy.bandwidthUsed / proxy.bandwidthLimit > 0.7
                      ? "bg-warning"
                      : "bg-primary"
                  }`}
                  style={{ width: `${Math.min((proxy.bandwidthUsed / proxy.bandwidthLimit) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Charts and Logs */}
          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="charts" className="flex-1">Charts</TabsTrigger>
              <TabsTrigger value="logs" className="flex-1">Recent Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-4">
              {/* Bandwidth Chart */}
              <Card variant="default">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Weekly Bandwidth (MB)</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={proxy.usageHistory}>
                        <defs>
                          <linearGradient id="bandwidthGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="bandwidth"
                          stroke="hsl(199, 89%, 48%)"
                          fill="url(#bandwidthGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate Chart */}
              <Card variant="default">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Success Rate (%)</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={proxy.usageHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[90, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="successRate" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card variant="default">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Recent Requests</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    {proxy.recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {log.success ? (
                            <CheckCircle className="w-3 h-3 text-success shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-destructive shrink-0" />
                          )}
                          <span className="truncate">{log.url}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                          <Badge variant={log.statusCode === 200 ? "outline" : "destructive"} className="text-[10px]">
                            {log.statusCode}
                          </Badge>
                          <span>{log.latency}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Connection Details */}
          <Card variant="glass" className="mt-4">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">IP Address</span>
                  <p className="font-mono">{proxy.ip}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Port</span>
                  <p className="font-mono">{proxy.port}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Protocol</span>
                  <p>{proxy.protocol}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Checked</span>
                  <p>{proxy.lastChecked}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
