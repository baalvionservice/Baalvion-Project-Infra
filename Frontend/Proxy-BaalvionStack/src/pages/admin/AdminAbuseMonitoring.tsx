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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ShieldAlert,
  AlertTriangle,
  Ban,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAbuseLogs, useResolveAbuseLog, useAdminRateLimits } from "@/hooks/useAdmin";

const typeConfig: Record<string, { label: string; variant: "warning" | "destructive" | "secondary" }> = {
  rate_limit: { label: "Rate Limit", variant: "warning" },
  abuse_flag: { label: "Abuse Flag", variant: "destructive" },
  auto_block: { label: "Auto Block", variant: "destructive" },
  default: { label: "Alert", variant: "secondary" },
};

export default function AdminAbuseMonitoring() {
  const { data: logsPage } = useAdminAbuseLogs({ page: 1, pageSize: 100 });
  const { data: rateLimitConfigs = [] } = useAdminRateLimits();
  const resolveLog = useResolveAbuseLog();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();

  const abuseLogs = (logsPage?.data ?? []).map((l) => ({
    id: String(l.id),
    userId: l.orgId ?? "",
    userName: l.orgId ?? "Unknown",
    type: (l.eventType ?? "default") as keyof typeof typeConfig,
    timestamp: new Date(l.createdAt).toLocaleString(),
    details: l.reason ?? String(l.details ?? ""),
    action: l.severity ?? "logged",
    resolved: l.resolved,
  }));

  const filteredLogs = abuseLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleResolve = (logId: string) => {
    resolveLog.mutate(logId);
    toast({ title: "Log Resolved", description: "Abuse log marked as resolved" });
  };

  const activeCount = abuseLogs.filter((l) => !l.resolved).length;
  const rateLimitCount = abuseLogs.filter((l) => l.type === "rate_limit").length;
  const autoBlockCount = abuseLogs.filter((l) => l.type === "auto_block").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Abuse & Rate Limit Monitoring</h1>
          <p className="text-muted-foreground">Monitor and manage platform abuse and rate limiting.</p>
        </div>
        <Button variant="outline" size="sm">
          <ShieldAlert className="w-4 h-4 mr-2" />
          Configure Rules
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{rateLimitCount}</p>
                <p className="text-xs text-muted-foreground">Rate Limited</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{autoBlockCount}</p>
                <p className="text-xs text-muted-foreground">Auto Blocked</p>
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
                <p className="text-2xl font-bold text-success">
                  {abuseLogs.filter((l) => l.resolved).length}
                </p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Configs */}
      <Card variant="default">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Rate Limit Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {rateLimitConfigs.map((config) => (
              <div
                key={config.id}
                className={`p-4 rounded-lg border ${
                  config.enabled ? "bg-secondary/30 border-border" : "bg-secondary/10 border-border/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{config.name}</h4>
                  <Badge variant={config.enabled ? "success" : "secondary"}>
                    {config.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Req/min</span>
                    <span className="font-mono">
                      {config.requestsPerMinute === -1 ? "∞" : config.requestsPerMinute.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Req/hour</span>
                    <span className="font-mono">
                      {config.requestsPerHour === -1 ? "∞" : config.requestsPerHour.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Burst</span>
                    <span className="font-mono">
                      {config.burstLimit === -1 ? "∞" : config.burstLimit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card variant="default">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-secondary/50">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rate_limit">Rate Limit</SelectItem>
                <SelectItem value="abuse_flag">Abuse Flag</SelectItem>
                <SelectItem value="auto_block">Auto Block</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Abuse Logs Table */}
      <Card variant="default">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Abuse Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Action Taken</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const type = typeConfig[log.type];

                return (
                  <TableRow key={log.id} className="border-border/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.userName}</p>
                        <p className="text-xs text-muted-foreground">{log.userId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.variant}>{type.label}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate">{log.details}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.action}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{log.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant={log.resolved ? "success" : "destructive"}>
                        {log.resolved ? "Resolved" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!log.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolve(log.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
