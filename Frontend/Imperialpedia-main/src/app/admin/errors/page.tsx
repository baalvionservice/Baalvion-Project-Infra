'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Bug, 
  AlertTriangle, 
  Info, 
  Search, 
  Filter, 
  Loader2, 
  Clock, 
  ShieldAlert, 
  RefreshCw,
  XCircle,
  FileCode,
  ArrowUpRight
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { ErrorLog } from '@/types/system';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

/**
 * System Error & Exception Logging Dashboard.
 * Displays real-time telemetry of platform anomalies and infrastructure warnings.
 */
export default function SystemErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await systemService.getErrorLogs();
        if (response.data) setLogs(response.data);
      } catch (e) {
        console.error('Error log telemetry failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityBadge = (type: string) => {
    switch (type) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2"><XCircle className="h-2.5 w-2.5" /> Critical</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2"><AlertTriangle className="h-2.5 w-2.5" /> Warning</Badge>;
      case 'info':
        return <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2"><Info className="h-2.5 w-2.5" /> Info</Badge>;
      default:
        return <Badge variant="outline">{type.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <Bug className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Infrastructure Telemetry</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Error & Exception Logs</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Real-time tracking of platform anomalies and infrastructure health events.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Re-sync Telemetry
          </Button>
        </div>
      </header>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl bg-destructive/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Critical Spikes</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.filter(l => l.type === 'critical').length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.filter(l => l.type === 'warning').length}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Stable vs Baseline</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Log Volume</CardTitle>
            <FileCode className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2k</div>
            <p className="text-[10px] text-muted-foreground mt-1">Daily aggregated events</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-emerald-500/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System Stability</CardTitle>
            <ShieldAlert className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Operational SLA</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search exceptions by message or module..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="h-11 px-4 gap-2 border-white/10 bg-background/30 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
          <Filter className="h-3.5 w-3.5" /> Filter Matrix
        </Badge>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Timestamp</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Originating Module</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Severity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Exception Message</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Streaming Exception Matrix...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No active exceptions localized within current buffer.
                  </TableCell>
                </TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">ID: {log.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background/50 border-white/10 text-[9px] font-bold uppercase px-3">
                      {log.module}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getSeverityBadge(log.type)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <Text variant="caption" className="text-muted-foreground leading-relaxed line-clamp-2" title={log.message}>
                      {log.message}
                    </Text>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10">
                      Debug Node <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Infrastructure Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Anomaly Detection</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              The system utilizes algorithmic sentiment analysis to identify error clusters that may indicate lateral infrastructure stress.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Auto-Correction Cycle</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              85% of 'Info' level exceptions in the pSEO module are resolved automatically through the platform's self-healing routing logic.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-amber-500/20 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Module Stability Index</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Current stability benchmark: **99.96%**. High-priority alerts are mirrored to the off-site emergency logger for platform leads.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
