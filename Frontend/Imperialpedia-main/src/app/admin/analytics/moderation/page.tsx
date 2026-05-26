'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Search, 
  Filter, 
  Loader2, 
  Clock, 
  Flag,
  Trash2,
  FileText,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { ModerationAnalytics } from '@/types/analytics';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

/**
 * Content Moderation Analytics Dashboard.
 * Monitors report velocity, expert conduct, and integrity task status.
 */
export default function ModerationAnalyticsPage() {
  const [data, setData] = useState<ModerationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getModerationAnalytics();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Moderation sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = data.filter(item => 
    item.content.toLowerCase().includes(search.toLowerCase()) ||
    item.creator.toLowerCase().includes(search.toLowerCase()) ||
    item.reportType.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: ModerationAnalytics['status']) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <Clock className="h-2.5 w-2.5" /> Pending
        </Badge>;
      case 'Reviewed':
        return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <CheckCircle2 className="h-2.5 w-2.5" /> Reviewed
        </Badge>;
      case 'Action Taken':
        return <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <ShieldAlert className="h-2.5 w-2.5" /> Action Taken
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === 'Pending').length,
    completed: data.filter(d => d.status !== 'Pending').length
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldAlert className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Integrity Oversight</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">Moderation Audit</Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30" asChild>
            <Link href="/admin/moderation">Access Moderation Queue <ChevronRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      {/* Aggregate Integrity Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Reports</CardTitle>
            <Flag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Platform-wide cumulative</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending Triage</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-[10px] text-amber-500 font-bold mt-1">Requiring immediate audit</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resolved Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Action finalized</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search moderation archive by content, creator, or type..." 
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
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Content Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Expert Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Classification</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Lifecycle Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Indexing Integrity Records...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No matching moderation records localized.
                  </TableCell>
                </TableRow>
              ) : filteredData.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold truncate max-w-[200px]">{item.content}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <User className="h-3.5 w-3.5 text-secondary" />
                      {item.creator}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background/50 border-white/10 text-[9px] font-bold uppercase px-3">
                      {item.reportType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(item.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold">{format(new Date(item.date), 'MMM d, yyyy')}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(item.date), 'HH:mm')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Moderation Strategy Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Conduct Thresholds</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              The system automatically flags content nodes that exceed a 5% report-to-view ratio for priority administrative review.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Integrity Purge Protocol</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Action Taken status indicates that the content has been de-indexed and the creator's reputation score has been adjusted accordingly.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
