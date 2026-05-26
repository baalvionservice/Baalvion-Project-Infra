'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  History, 
  User, 
  Search, 
  Filter, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileCode,
  ArrowUpRight,
  ShieldAlert,
  Download
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { AdminActivityLog } from '@/types/system';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

/**
 * Administrative Activity Log Dashboard.
 * Immutable record of all administrative actions for platform governance.
 */
export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await systemService.getAdminLogs();
        if (response.data) setLogs(response.data);
      } catch (e) {
        console.error('Activity log sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.admin.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.target.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: AdminActivityLog['status']) => {
    switch (status) {
      case 'Success':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <CheckCircle2 className="h-2.5 w-2.5" /> Success
        </Badge>;
      case 'Failed':
        return <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <XCircle className="h-2.5 w-2.5" /> Failed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldAlert className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Governance</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Admin Activity Log</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Immutable audit trail of all administrative events across the Imperialpedia cluster.
          </Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Audit Integrity Sealed</span>
        </div>
      </header>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Actions</CardTitle>
            <History className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0 
                ? ((logs.filter(l => l.status === 'Success').length / logs.length) * 100).toFixed(1)
                : '0'}%
            </div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Operational Stable</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-destructive/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Critical Failures</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.filter(l => l.status === 'Failed').length}</div>
            <p className="text-[10px] text-destructive font-bold mt-1">Requiring Review</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Admins</CardTitle>
            <User className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map(l => l.admin)).size}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Authorized Nodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm sticky top-20 z-30">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search log by admin, action, or target entity..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 px-4 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs">
            <Filter className="h-3.5 w-3.5" /> Filter Matrix
          </Button>
          <Button variant="outline" className="h-11 px-4 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest py-4">Administrator</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Administrative Action</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Target Entity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Execution Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Retrieving Audit Chain...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No matching activity records localized.
                  </TableCell>
                </TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold">{log.admin}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">{log.action}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px] block" title={log.target}>
                      {log.target}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold">{format(new Date(log.date), 'MMM d, yyyy')}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(log.date), 'HH:mm:ss')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Strategic Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Audit Integrity</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Every action taken within the Administrative Control panel is cryptographically signed and logged. Activity logs are immutable and retained for **365 days** for regulatory compliance.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <FileCode className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Failure Analysis</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Actions marked as **Failed** are automatically escalated to the Platform Lead. Most failures in permission shifts are due to lateral protection protocols preventing circular dependency.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
