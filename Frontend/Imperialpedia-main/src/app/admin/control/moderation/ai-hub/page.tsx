'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Loader2,
  Clock,
  Eye,
  ArrowLeft,
  FileText,
  User,
  ShieldCheck,
  Flag,
  Check,
  ChevronRight,
  Info,
  Zap,
  Activity,
  AlertTriangle,
  Flame,
  MessageSquare,
  History,
  Terminal,
  Scale,
  Heart,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { moderationService } from '@/services/data/moderation-service';
import { AIModerationHubData, FlaggedContentDetail } from '@/types/moderation';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

/**
 * AI Moderation Dashboard.
 * Specialized control hub for detecting spam, misinformation, and toxic nodes via AI synthesis.
 */
export default function AIModerationHubPage() {
  const [data, setData] = useState<AIModerationHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inspectedItem, setInspectedItem] = useState<FlaggedContentDetail | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await moderationService.getAIModerationHubData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Moderation sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleModerationAction = async (id: string, action: string) => {
    setProcessing(id);
    // Simulate vertical escalation or state commit
    await new Promise(r => setTimeout(r, 1200));
    setProcessing(null);
    setInspectedItem(null);

    toast({
      title: "Action Committed",
      description: `Moderation directive "${action}" has been broadcast to the cluster for ${id}.`,
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Integrity Handshake...
        </Text>
      </div>
    );
  }

  const filteredFlagged = data.flagged_content.filter(item =>
    item.author.toLowerCase().includes(search.toLowerCase()) ||
    item.reason.toLowerCase().includes(search.toLowerCase()) ||
    item.content_preview.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2"><Clock className="h-2.5 w-2.5 animate-pulse" /> Pending</Badge>;
      case 'Under Review':
        return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">Under Review</Badge>;
      case 'Resolved':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldAlert className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Safety Command Center</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">AI Moderation Control</Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Algorithmic Guard Active</span>
        </div>
      </header>

      {/* METRICS SUMMARY GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Flagged Content', value: data.moderation_metrics.flagged_content, icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/5' },
          { label: 'Under Review', value: data.moderation_metrics.articles_under_review, icon: FileText, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Flagged Comments', value: data.moderation_metrics.flagged_comments, icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/5' },
          { label: 'User Reports', value: data.moderation_metrics.user_reports, icon: Flag, color: 'text-secondary', bg: 'bg-secondary/5' },
          { label: 'Resolved Cases', value: data.moderation_metrics.resolved_cases, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
        ].map((stat) => (
          <Card key={stat.label} className={cn("glass-card border-none shadow-xl group hover:scale-105 transition-all duration-500", stat.bg)}>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <stat.icon className={cn("h-5 w-5", stat.color)} />
              <div className="text-2xl font-bold tracking-tighter">{stat.value}</div>
              <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest">{stat.label}</Text>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-8">

        {/* MAIN FLAGGED PIPELINE */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Flagged Intelligence Pipeline</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Awaiting Human Decision Handshake</Text>
              </div>
            </div>

            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search audit IDs..."
                className="pl-10 h-10 bg-card/30 border-white/5 rounded-xl text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Content Type</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Author</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Flag Reason</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">AI Risk</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFlagged.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-all">
                            {item.type === 'Article' ? <FileText className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                          </div>
                          <span className="text-sm font-bold uppercase tracking-tight">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-secondary" />
                          <span className="text-xs font-medium">{item.author}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground italic truncate max-w-[150px] block">{item.reason}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "text-xs font-bold font-mono",
                            item.risk_score > 80 ? "text-destructive" : "text-amber-500"
                          )}>{item.risk_score}%</span>
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={cn(
                              "h-full",
                              item.risk_score > 80 ? "bg-destructive" : "bg-amber-500"
                            )} style={{ width: `${item.risk_score}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {getStatusBadge(item.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all"
                          onClick={() => setInspectedItem(item)}
                        >
                          Audit Node
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* SIDEBAR: RISK INDICATORS & COMMUNITY REPORTS */}
        <aside className="lg:col-span-4 space-y-10">
          {/* AI RISK DETECTION INDICATORS */}
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Activity className="h-4 w-4" /> Risk Detection Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Spam Probability', value: 82, color: 'bg-amber-500' },
                { label: 'Misinformation Risk', value: 65, color: 'bg-primary' },
                { label: 'Toxic Language Detection', value: 42, color: 'bg-destructive' },
                { label: 'Market Manipulation Claims', value: 12, color: 'bg-emerald-500' },
              ].map((risk) => (
                <div key={risk.label} className="space-y-2 group cursor-default">
                  <div className="flex justify-between items-end">
                    <Text variant="label" className="text-[9px] opacity-50 font-bold uppercase tracking-widest">{risk.label}</Text>
                    <span className="text-xs font-mono font-bold">{risk.value}%</span>
                  </div>
                  <Progress value={risk.value} className="h-1 bg-white/5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* COMMUNITY REPORTS LIST */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Community Signals</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Factual Challenges & User Flags</Text>
              </div>
            </div>

            <div className="space-y-4">
              {data.community_reports.map((report) => (
                <Card key={report.id} className="glass-card border-none bg-background/30 hover:border-secondary/30 transition-all cursor-pointer">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[8px] font-bold uppercase border-white/10 bg-black/20">{report.reason}</Badge>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">{report.timestamp.split('T')[1].substring(0, 5)}</span>
                    </div>
                    <Text variant="bodySmall" weight="bold" className="block truncate">"{report.content_title}"</Text>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-[10px] text-muted-foreground">Reported by: <strong>{report.reporter}</strong></span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </aside>

        {/* Strategic Insight */}
        <div className="p-8 lg:col-span-4 rounded-[3rem] bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Sparkles className="h-16 w-16 text-primary rotate-12" />
          </div>
        </div>
      </div>

      {/* MODERATION HISTORY SECTION */}
      <section className="space-y-8 pt-10 border-t border-white/5">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted text-muted-foreground">
              <History className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">Audit History Archive</Text>
              <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Immutable Governance Logs</Text>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary font-bold text-xs">Full Archive <ArrowRight className="ml-2 h-3 w-3" /></Button>
        </div>

        <Card className="glass-card border-none shadow-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-4">Moderator Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Action Taken</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Entity Type</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Resolution Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.history.length > 0 && data.history.map((log) => (
                <TableRow key={log.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                  <TableCell className="py-4 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-background/50 border border-white/5 flex items-center justify-center text-[10px] font-bold text-primary">{log.moderator.charAt(0)}</div>
                      <span className="text-sm font-medium">{log.moderator}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "text-[9px] font-bold uppercase h-5 px-2",
                      log.action === 'Removed' ? "bg-destructive/10 text-destructive" :
                        log.action === 'Approved' ? "bg-emerald-500/10 text-emerald-500" :
                          "bg-amber-500/10 text-amber-500"
                    )}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs text-muted-foreground uppercase">{log.type}</TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-foreground/70">{log.date.split('T')[0]}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{log.date.split('T')[1].substring(0, 5)} UTC</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* CONTENT REVIEW DIALOG */}
      <Dialog open={!!inspectedItem} onOpenChange={(open) => !open && setInspectedItem(null)}>
        <DialogContent className="max-w-3xl bg-card border-white/10 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3 h-6">
                Intelligence Audit Console
              </Badge>
              {inspectedItem?.status && getStatusBadge(inspectedItem?.status ?? "")}
            </div>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-primary" />
              Review Node: {inspectedItem?.author}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Cross-referencing entity data with the **Global Misinformation Matrix**.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar bg-background/50">
            {/* Raw Content Payload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                <FileText className="h-3.5 w-3.5" /> Content Payload
              </div>
              <div className="p-6 rounded-2xl bg-background/50 border border-white/5 text-base leading-relaxed italic text-foreground/90">
                "{inspectedItem?.content_preview}"
              </div>
            </div>

            {/* AI Risk Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive font-bold text-[10px] uppercase tracking-widest">
                  <Zap className="h-3.5 w-3.5" /> AI Risk Synthesis
                </div>
                <div className="space-y-4 p-6 rounded-2xl bg-destructive/5 border border-destructive/10">
                  {inspectedItem && Object.entries(inspectedItem.risk_analysis).map(([key, val]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span className="text-muted-foreground">{key}</span>
                        <span className={val > 70 ? 'text-destructive' : 'text-foreground'}>{val}%</span>
                      </div>
                      <Progress value={val} className="h-1 bg-white/5" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-secondary font-bold text-[10px] uppercase tracking-widest">
                  <TrendingUp className="h-3.5 w-3.5" /> Engagement Vitals
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/50 border border-white/5 text-center space-y-1">
                    <div className="text-lg font-bold">{inspectedItem?.engagement.views}</div>
                    <Text variant="label" className="text-[8px] opacity-50 uppercase">Reach</Text>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-white/5 text-center space-y-1">
                    <div className="text-lg font-bold">{inspectedItem?.engagement.likes}</div>
                    <Text variant="label" className="text-[8px] opacity-50 uppercase">Nodes</Text>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase mb-2">
                    <Info className="h-3.5 w-3.5" /> Triage Recommendation
                  </div>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                    "High **Misinformation** score correlated with non-verified expert node. Suggest request for primary sources or removal if unconfirmed."
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 gap-3">
            <Button variant="ghost" onClick={() => setInspectedItem(null)} className="h-12 px-6 rounded-xl font-bold">Close Handshake</Button>
            <Button
              variant="outline"
              className="h-12 px-6 rounded-xl font-bold border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
              onClick={() => handleModerationAction(inspectedItem?.id!, 'Request Revision')}
            >
              Request Revision
            </Button>
            <Button
              variant="outline"
              className="h-12 px-6 rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10"
              onClick={() => handleModerationAction(inspectedItem?.id!, 'Remove Node')}
            >
              Purge Node
            </Button>
            <Button
              className="h-12 px-10 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-900/20"
              onClick={() => handleModerationAction(inspectedItem?.id!, 'Approve')}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}