"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/design-system/typography/text";
import {
  ShieldCheck,
  History,
  User,
  Settings,
  FileText,
  Clock,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { getAuditLogs } from "@/services/mock-api/audit";
import { AuditLog } from "@/modules/content-engine/types/article";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await getAuditLogs();
        setLogs(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-3.5 w-3.5" />;
      case "content":
        return <FileText className="h-3.5 w-3.5" />;
      default:
        return <Settings className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">
            System Audit Trail
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Global log of all administrative and content-level events.
          </Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Compliance Mode Active
          </span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit trail..."
            className="pl-10 bg-background/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="h-10 px-4 gap-2 border-primary/20">
          <Filter className="h-3.5 w-3.5" /> Filter Logs
        </Badge>
      </div>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Event Type</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Administrator</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/20">
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary gap-1.5 font-bold uppercase text-[10px]"
                    >
                      {getTypeIcon(log.type)} {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-sm">
                    {log.action}
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs text-muted-foreground truncate max-w-xs block"
                      title={log.details}
                    >
                      {log.details}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {log.actor.charAt(0)}
                      </div>
                      <span className="text-xs">{log.actor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold">
                        {format(new Date(log.timestamp), "MMM d, yyyy")}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{" "}
                        {format(new Date(log.timestamp), "HH:mm:ss")}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <History className="h-8 w-8 text-primary" />
          <div>
            <Text variant="bodySmall" weight="bold">
              Log Retention
            </Text>
            <Text variant="caption" className="text-muted-foreground mt-1">
              Audit logs are retained for 365 days for regulatory compliance and
              platform security.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-emerald-500/20 p-6 flex flex-col gap-4">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          <div>
            <Text variant="bodySmall" weight="bold">
              Integrity Verified
            </Text>
            <Text variant="caption" className="text-muted-foreground mt-1">
              The current audit chain is cryptographically sealed and verified
              against tampering.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <Settings className="h-8 w-8 text-secondary" />
          <div>
            <Text variant="bodySmall" weight="bold">
              Security Alerts
            </Text>
            <Text variant="caption" className="text-muted-foreground mt-1">
              Real-time alerts for critical administrative actions are sent to
              the Platform Lead.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
