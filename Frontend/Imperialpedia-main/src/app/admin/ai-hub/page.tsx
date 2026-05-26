'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Sparkles, 
  Zap, 
  Search, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Brain,
  MessageSquare,
  Edit,
  Clock,
  Layout,
  Terminal,
  RefreshCw,
  Plus,
  Target,
  ChevronRight
} from 'lucide-react';
import { getMediaAdminData } from '@/services/mock-api/admin-media';
import { MediaAdminDashboardData } from '@/types/admin-media';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function AIIntegrationHubPage() {
  const [data, setData] = useState<MediaAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      const response = await getMediaAdminData();
      if (response.data) setData(response.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleGenerateSummary = async () => {
    setGenerating(true);
    toast({
      title: "Synthesis Initiated",
      description: "Claude 3.5 is traversing the global market wire for breaking updates...",
    });
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    toast({
      title: "Summary Node Ready",
      description: "Draft created in 'Review' status.",
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Neural Link...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Brain className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Intelligence Orchestration</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">AI / Claude Integration Hub</Text>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 px-6 border-white/10 bg-card/30">
            <Terminal className="mr-2 h-4 w-4 text-primary" /> API Logs
          </Button>
          <Button 
            onClick={handleGenerateSummary}
            disabled={generating}
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95"
          >
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Breaking Summary
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* DRAFTING QUEUE */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">AI Intelligence Pipeline</CardTitle>
                <CardDescription>Review and audit automatically drafted research nodes.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-bold uppercase text-[9px] px-3">Lifecycle Matrix</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Target Topic</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Model</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">SEO Score</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.aiDrafts.map((draft) => (
                    <TableRow key={draft.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground/90">{draft.topic}</span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">{draft.wordCount} Words Generated</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[8px] font-mono border-white/10">{draft.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-bold text-primary font-mono">{draft.seoScore}%</span>
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${draft.seoScore}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Badge className={cn(
                            "text-[8px] font-bold uppercase border-none px-2 h-5",
                            draft.status === 'ready' ? "bg-emerald-500/10 text-emerald-500" :
                            draft.status === 'review' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                          )}>
                            {draft.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary"><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* AI CAPABILITIES OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-none shadow-xl bg-primary/5 p-8 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles className="h-24 w-24 text-primary" />
              </div>
              <div className="p-3 rounded-2xl bg-primary/10 text-primary w-fit"><Zap className="h-6 w-6" /></div>
              <Text variant="h3" className="font-bold">Breaking News Crawler</Text>
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
                "Currently tracking 142 institutional market wires. Claude 3.5 is architected to synthesize breaking news nodes into structured summaries in under 10 minutes."
              </Text>
            </Card>

            <Card className="glass-card border-none bg-secondary/5 p-8 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Layout className="h-24 w-24 text-secondary" />
              </div>
              <div className="p-3 rounded-2xl bg-secondary/10 text-secondary w-fit"><Plus className="h-6 w-6" /></div>
              <Text variant="h3" className="font-bold">Research Architect</Text>
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
                "Generate a 2,000-word research audit for any financial node. AI drafts automatically include cross-citation logic from the primary Imperialpedia Index."
              </Text>
            </Card>
          </div>
        </div>

        {/* AI PERFORMANCE SIDEBAR */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Activity className="h-4 w-4" /> Synthesis Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Token Efficiency', value: '94%', color: 'bg-emerald-500' },
                { label: 'Fact-Check Precision', value: '99.8%', color: 'bg-primary' },
                { label: 'SEO Authority Alignment', value: '82%', color: 'bg-secondary' },
                { label: 'Average Ingestion Delay', value: '420ms', color: 'bg-primary' },
              ].map((vital) => (
                <div key={vital.label} className="space-y-2 group cursor-default">
                  <div className="flex justify-between items-end">
                    <Text variant="label" className="text-[9px] opacity-50 font-bold uppercase tracking-widest">{vital.label}</Text>
                    <span className="text-xs font-mono font-bold text-foreground group-hover:text-primary transition-colors">{vital.value}</span>
                  </div>
                  <Progress value={85} className="h-1 bg-white/5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-8 rounded-[3rem] bg-card/30 border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-2xl">
              <RefreshCw className="h-8 w-8" />
            </div>
            <Text variant="bodySmall" weight="bold">Model Benchmarking</Text>
            <Text variant="caption" className="text-muted-foreground leading-relaxed block">
              Auditing **Claude 3.5 Sonnet** against the current research buffer. Performance is synchronized with our institutional ethics cluster.
            </Text>
            <Button variant="outline" className="w-full h-11 rounded-xl border-primary/20 text-primary font-bold text-xs uppercase">
              Switch Model Provider
            </Button>
          </div>

          <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <Target className="h-4 w-4" /> Content Strategy
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "AI suggests expanding into the **'Carbon Credits'** taxonomy. Discovery volume for related nodes has spiked by 450% in the EU-West cluster this cycle."
            </Text>
          </Card>
        </aside>
      </div>
    </div>
  );
}