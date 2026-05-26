import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Smartphone, Server, Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useAdminProviders } from "@/hooks/useAdmin";

const poolIcons: Record<string, typeof Globe> = {
  Residential: Globe,
  Mobile: Smartphone,
  Datacenter: Server,
};

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle; label: string }> = {
  healthy: { variant: "success", icon: CheckCircle, label: "Healthy" },
  active: { variant: "success", icon: CheckCircle, label: "Healthy" },
  degraded: { variant: "warning", icon: AlertTriangle, label: "Degraded" },
  critical: { variant: "destructive", icon: XCircle, label: "Critical" },
  inactive: { variant: "destructive", icon: XCircle, label: "Inactive" },
};

export function IPPoolHealthSection() {
  const { data: providersPage } = useAdminProviders({ page: 1, pageSize: 20 });
  const providers = providersPage?.data ?? [];

  const pools = providers.map((p, i) => ({
    type: i % 3 === 0 ? "Residential" : i % 3 === 1 ? "Datacenter" : "Mobile",
    name: p.name,
    avgLatency: p.latency ?? 200,
    successRate: p.successRate ?? 97,
    errorRate: +(100 - (p.successRate ?? 97)).toFixed(1),
    status: p.status === "active" ? "healthy" : p.status ?? "healthy",
    totalIPs: (p.totalProxies ?? 100) * 10000,
    activeIPs: Math.round((p.totalProxies ?? 100) * 8500),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">IP Pool Health</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {pools.map(pool => {
          const PoolIcon = poolIcons[pool.type] ?? Globe;
          const status = statusConfig[pool.status] ?? statusConfig.healthy;
          const StatusIcon = status.icon;

          return (
            <Card key={pool.name} variant="stats" className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                pool.status === "healthy" || pool.status === "active" ? "bg-success"
                  : pool.status === "degraded" ? "bg-warning" : "bg-destructive"
              }`} />

              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PoolIcon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{pool.name}</CardTitle>
                  </div>
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg Latency</p>
                    <p className="text-lg font-semibold">{pool.avgLatency}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                    <p className={`text-lg font-semibold ${pool.successRate >= 98 ? "text-success" : pool.successRate >= 95 ? "text-warning" : "text-destructive"}`}>
                      {pool.successRate}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
                    <p className={`text-lg font-semibold ${pool.errorRate <= 1 ? "text-success" : pool.errorRate <= 3 ? "text-warning" : "text-destructive"}`}>
                      {pool.errorRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Active IPs</p>
                    <p className="text-lg font-semibold">
                      {(pool.activeIPs / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Pool Utilization</span>
                    <span>{((pool.activeIPs / pool.totalIPs) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(pool.activeIPs / pool.totalIPs) * 100}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
