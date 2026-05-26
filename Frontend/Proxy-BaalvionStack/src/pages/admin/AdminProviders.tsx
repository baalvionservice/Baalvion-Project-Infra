import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Provider } from "@/types/admin";
import { ProviderDetailDrawer } from "@/components/admin/ProviderDetailDrawer";
import { useAdminProviders } from "@/hooks/useAdmin";

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle; label: string }> = {
  healthy: { variant: "success", icon: CheckCircle, label: "Healthy" },
  degraded: { variant: "warning", icon: AlertTriangle, label: "Degraded" },
  down: { variant: "destructive", icon: XCircle, label: "Down" },
};

export default function AdminProviders() {
  const { data: rawProviders = [], refetch } = useAdminProviders();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const providers: Provider[] = rawProviders.map((p) => ({
    id: String(p.id),
    name: p.name,
    status: (p.status as Provider["status"]) ?? "healthy",
    avgLatency: p.latency ?? 0,
    successRate: p.successRate ?? 100,
    supportedCountries: [],
    lastCheck: new Date(p.updatedAt).toLocaleDateString(),
    latencyTrend: [],
    successTrend: [],
    recentIncidents: [],
  }));

  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const healthyCount = providers.filter((p) => p.status === "healthy").length;
  const degradedCount = providers.filter((p) => p.status === "degraded").length;
  const downCount = providers.filter((p) => p.status === "down").length;
  const activeProviders = providers.filter((p) => p.status !== "down");
  const avgLatency = activeProviders.length > 0
    ? Math.round(activeProviders.reduce((sum, p) => sum + p.avgLatency, 0) / activeProviders.length)
    : 0;

  const handleRowClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Provider Management</h1>
          <p className="text-muted-foreground">Monitor and manage proxy suppliers.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{providers.length}</p>
                <p className="text-xs text-muted-foreground">Total Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{healthyCount}</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{degradedCount}</p>
                <p className="text-xs text-muted-foreground">Degraded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{downCount}</p>
                <p className="text-xs text-muted-foreground">Down</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Latency Card */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Average Provider Latency</span>
            </div>
            <span className="text-2xl font-bold">{avgLatency}ms</span>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card variant="default">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card variant="default">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">All Providers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Provider Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avg Latency</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Last Check</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => {
                const status = statusConfig[provider.status];
                const StatusIcon = status.icon;

                return (
                  <TableRow
                    key={provider.id}
                    className="border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => handleRowClick(provider)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Server className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{provider.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={provider.avgLatency > 60 ? "text-warning" : ""}>
                        {provider.status === "down" ? "—" : `${provider.avgLatency}ms`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          provider.status === "down"
                            ? "text-muted-foreground"
                            : provider.successRate >= 98
                            ? "text-success"
                            : provider.successRate >= 95
                            ? "text-warning"
                            : "text-destructive"
                        }
                      >
                        {provider.status === "down" ? "—" : `${provider.successRate}%`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">{provider.supportedCountries.length}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {provider.lastCheck}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Provider Detail Drawer */}
      <ProviderDetailDrawer
        provider={selectedProvider}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
