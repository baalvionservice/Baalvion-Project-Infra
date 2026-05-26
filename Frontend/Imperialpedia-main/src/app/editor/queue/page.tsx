'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import {
  FileSearch,
  Search,
  Filter,
  Loader2,
  Clock,
  ChevronRight,
  ArrowLeft,
  ArrowUpRight,
  Layers,
  Users,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { getEditorialDashboardData } from '@/services/mock-api/editorial';
import { EditorialSubmission, ReviewStatus } from '@/types/editorial';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Editorial Submission Queue Matrix.
 * Specialized control interface for prioritizing and triaging high-scale research nodes.
 */
export default function EditorialQueuePage() {
  const [submissions, setSubmissions] = useState<EditorialSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'All'>('All');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getEditorialDashboardData();
        if (response.data) setSubmissions(response.data.submissions);
      } catch (e) {
        console.error('Queue sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = submissions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.author.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'Submitted':
        return <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[8px] h-5 px-2">Submitted</Badge>;
      case 'Under Review':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[8px] h-5 px-2 animate-pulse">In Review</Badge>;
      case 'Revision Requested':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-bold uppercase text-[8px] h-5 px-2">Revision</Badge>;
      case 'Approved':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[8px] h-5 px-2">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/editor/dashboard"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <FileSearch className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Pipeline Triage</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Submission Matrix</Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-white/10 bg-card/30 text-[10px] font-bold uppercase h-11 px-6 gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" /> Avg. Review: 4.2h
          </Badge>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-20 z-30 shadow-lg">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by intelligence headline or expert identity..."
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {['All', 'Submitted', 'Under Review', 'Revision Requested'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "rounded-xl h-12 px-6 font-bold text-[10px] uppercase tracking-widest transition-all",
                filterStatus === status ? "bg-primary shadow-lg" : "text-muted-foreground hover:text-primary"
              )}
              onClick={() => setFilterStatus(status as any)}
            >
              {status === 'Revision Requested' ? 'Revisions' : status}
            </Button>
          ))}
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Intelligence Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Expert Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Quality Score</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Lifecycle Status</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Assigned Auditor</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Streaming Submission Nodes...</Text>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                    No active submissions localized in the current discovery buffer.
                  </TableCell>
                </TableRow>
              ) : filtered.map((sub) => (
                <TableRow key={sub.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <div className="flex flex-col max-w-[300px]">
                      <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors truncate block">{sub.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[8px] font-bold border-primary/20 bg-primary/5 text-primary px-1.5 h-4 uppercase">{sub.category}</Badge>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase">ID: {sub.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-secondary" />
                      <span className="text-xs font-medium">{sub.author}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold font-mono text-primary">{sub.quality_score}%</span>
                      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${sub.quality_score}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(sub.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-muted-foreground">{sub.assigned_editor}</span>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all" asChild>
                      <Link href={`/editor/review/${sub.id}`}>
                        Open Console <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
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
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Automatic Triage Logic</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              The matrix automatically flags submissions with a **Quality Score &lt; 60%** for immediate revision requests. Verified Experts bypass the initial heuristic filter and proceed directly to manual audit.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Layers className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Governance Integrity</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Every decision committed in the queue is cryptographically logged in the **Audit Trail**. Changes to Review Status trigger an immediate activity feed dispatch to the author's Creator Studio.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
