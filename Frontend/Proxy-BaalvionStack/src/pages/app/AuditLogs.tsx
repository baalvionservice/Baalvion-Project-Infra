import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  History, Download, Filter, Search, Calendar, User, Key, Globe,
  Settings, CreditCard, Users, FileText, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PermissionGate } from "@/components/enterprise/RoleSwitcher";
import { HelpTooltip } from "@/components/enterprise/ContextualHelp";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { useAuditLogs } from "@/hooks/usePlatform";

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actionType: "proxy" | "user" | "api_key" | "billing" | "settings";
  user: string;
  userEmail: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failed" | "warning";
  resource: string;
}

const actionTypeConfig: Record<string, { icon: typeof Globe; color: string }> = {
  proxy: { icon: Globe, color: "text-primary" },
  user: { icon: Users, color: "text-accent" },
  api_key: { icon: Key, color: "text-warning" },
  billing: { icon: CreditCard, color: "text-success" },
  settings: { icon: Settings, color: "text-muted-foreground" },
  default: { icon: History, color: "text-muted-foreground" },
};

function inferActionType(action: string): AuditLog["actionType"] {
  if (action.startsWith("proxy")) return "proxy";
  if (action.startsWith("user") || action.startsWith("member")) return "user";
  if (action.startsWith("api_key") || action.startsWith("apikey")) return "api_key";
  if (action.startsWith("billing") || action.startsWith("invoice") || action.startsWith("payment")) return "billing";
  return "settings";
}

const PAGE_SIZE = 10;

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: logsPage } = useAuditLogs({ page: 1, pageSize: 200 });
  const allLogs: AuditLog[] = (logsPage?.data ?? []).map(entry => ({
    id: entry.id,
    timestamp: entry.createdAt,
    action: entry.action,
    actionType: inferActionType(entry.action),
    user: entry.actorUserId,
    userEmail: "",
    details: `${entry.action} — ${entry.entityType}:${entry.entityId}`,
    ipAddress: "",
    userAgent: "",
    status: "success" as const,
    resource: `${entry.entityType}:${entry.entityId}`,
  }));

  const filteredLogs = useMemo(() => allLogs.filter((log) => {
    if (searchQuery && !log.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.details.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.resource.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (actionFilter !== "all" && log.actionType !== actionFilter) return false;
    if (userFilter !== "all" && log.user !== userFilter) return false;
    return true;
  }), [searchQuery, actionFilter, userFilter]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const uniqueUsers = [...new Set(allLogs.map((log) => log.user))];

  const handleExport = (format: "csv" | "json") => {
    const exportData = filteredLogs.map(l => ({
      timestamp: l.timestamp,
      user: l.user,
      action: l.action,
      resource: l.resource,
      status: l.status,
    }));
    const content = format === "json"
      ? JSON.stringify(exportData, null, 2)
      : "timestamp,user,action,resource,status\n" +
        exportData.map(l => `"${l.timestamp}","${l.user}","${l.action}","${l.resource}","${l.status}"`).join("\n");

    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Audit logs exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Audit Logs" description="Track all account activity including proxy, user, API key, and billing changes." />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Audit Logs
            <HelpTooltip title="Audit Logs" description="Track all actions performed in your account. Logs are retained for 90 days." />
          </h1>
          <p className="text-muted-foreground">Complete history of account activity and changes.</p>
        </div>
        <PermissionGate permission="export">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
              <FileText className="w-4 h-4 mr-2" />Export JSON
            </Button>
          </div>
        </PermissionGate>
      </div>

      {/* Filters */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search actions, details, or resources..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-9 bg-secondary/50"
                aria-label="Search audit logs"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px] bg-secondary/50"><SelectValue placeholder="Action Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="proxy">Proxy</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px] bg-secondary/50"><SelectValue placeholder="User" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((user) => (<SelectItem key={user} value={user}>{user}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />Activity Timeline
            </CardTitle>
            <Badge variant="muted">{filteredLogs.length} entries</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Details</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => {
                const config = actionTypeConfig[log.actionType];
                const Icon = config.icon;
                const isExpanded = expandedLog === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center ${config.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{log.user}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={log.status === "success" ? "success" : log.status === "failed" ? "destructive" : "warning"} className="text-xs">
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm truncate max-w-[200px]">
                        {log.details}
                      </TableCell>
                      <TableCell>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </TableCell>
                    </TableRow>
                    <AnimatePresence>
                      {isExpanded && (
                        <TableRow key={`${log.id}-expanded`}>
                          <TableCell colSpan={6} className="p-0">
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-secondary/20 px-4 py-3">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                <div><p className="text-muted-foreground text-xs mb-1">Email</p><p>{log.userEmail}</p></div>
                                <div><p className="text-muted-foreground text-xs mb-1">IP Address</p><p className="font-mono">{log.ipAddress}</p></div>
                                <div><p className="text-muted-foreground text-xs mb-1">User Agent</p><p>{log.userAgent}</p></div>
                                <div><p className="text-muted-foreground text-xs mb-1">Resource</p><p className="font-mono">{log.resource}</p></div>
                                <div><p className="text-muted-foreground text-xs mb-1">Status</p><Badge variant={log.status === "success" ? "success" : log.status === "failed" ? "destructive" : "warning"} className="text-xs">{log.status}</Badge></div>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


