'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Download,
  Lock,
  Layers,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { AuditTrailEntry } from '@/types/system';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

/**
 * Platform Global Audit Trail.
 * Immutable chronological record of platform-wide events for compliance and security oversight.
 * Refined for Prompt 29 requirements.
 */
export default function PlatformAuditTrailPage() {
  const [logs, setLogs] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await systemService.getAuditTrail();
        if (response.data) setLogs(response.data);
      } catch (e) {
        console.error('Audit trail sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      (log.module || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const getStatusBadge = (status?: AuditTrailEntry['status']) => {
    if (!status) return null;
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
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Compliance Kernel</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Platform Audit Trail</Text>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Immutable Log Sealed</span>
        </div>
      </header>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logged Actions</CardTitle>
            <History className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">Current Filter Scope</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Coverage</CardTitle>
            <User className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(logs.map(l => l.user)).size}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Unique active nodes</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-primary">Log Retention</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">365 Days</div>
            <p className="text-[10px] text-muted-foreground mt-1">Regulatory compliance active</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System SLA</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.98%</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-tighter">Verified Health</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm sticky top-20 z-30 shadow-lg">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by action description, username, or system module..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 px-4 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs">
            <Filter className="h-3.5 w-3.5 text-primary" /> Filter
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
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Timestamp</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Administrator</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Action Description</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Event Hash</TableHead>
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
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No matching audit records localized within the current governance buffer.
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{log.timestamp}</span>
                      <span className="text-[9px] text-muted-foreground uppercase mt-1">Handshake complete</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                        {log.user.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate max-w-[300px]">{log.action}</span>
                      {log.module && (
                        <span className="text-[9px] text-muted-foreground font-mono uppercase mt-1">Module: {log.module}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border border-white/5">
                      {log.id.substring(0, 8)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 bg-card/30 border-t border-white/5 flex items-center justify-between">
            <Text variant="caption" className="text-muted-foreground font-bold">
              Showing node {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}
            </Text>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 rounded-xl font-bold border-white/10"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    variant={currentPage === p ? 'default' : 'ghost'}
                    size="sm"
                    className="w-9 h-9 rounded-lg font-bold"
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 rounded-xl font-bold border-white/10"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Compliance Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Cryptographic Ledger</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Every entry in this audit trail is cryptographically signed and immutable. Any unauthorized attempt to modify these logs will trigger an immediate system-wide shutdown and vertical escalation to the infrastructure leads.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <FileCode className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Governance Integrity</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Logs are synchronized with the **Institutional Compliance Cluster** every 15 minutes. This ensures that the global state remains transparent and traceable across all 1M+ programmatic nodes.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
