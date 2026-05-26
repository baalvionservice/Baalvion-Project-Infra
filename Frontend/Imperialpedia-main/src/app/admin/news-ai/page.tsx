'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Zap, 
  Brain, 
  Sparkles, 
  Send, 
  Loader2, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowRight, 
  Terminal, 
  Globe, 
  Newspaper,
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  History,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BreakingNewsAISystem() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const mockNewsDrafts = [
    { id: 'n1', topic: "Federal Reserve Interest Rates", sentiment: "Neutral", probability: "94%", status: "Drafting", time: "2m ago" },
    { id: 'n2', topic: "Global Oil Prices Surge", sentiment: "Bearish", probability: "88%", status: "Review", time: "10m ago" },
    { id: 'n3', topic: "Crypto Market Cap Hits 3T", sentiment: "Bullish", probability: "91%", status: "Ready", time: "42m ago" },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    toast({ title: "Synthesis Initiated", description: "AI Analyst is traversing global market wires..." });
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    toast({ title: "New Node Drafted", description: "Breaking news summary ready for human audit." });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Zap className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">High-Velocity Intelligence</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Breaking News AI</Text>
        </div>
        <Button 
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? 'Synthesizing...' : 'Generate Breaking Summary'}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* DRAFTING QUEUE */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Algorithmic Wire Feed</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Awaiting Human Decision Handshake</Text>
              </div>
            </div>
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Filter discovery nodes..." 
                className="pl-10 h-10 bg-card/30 border-white/5 rounded-xl text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {mockNewsDrafts.map((news) => (
              <Card key={news.id} className="glass-card border-none shadow-xl hover:border-primary/20 transition-all group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[8px] font-bold uppercase border-primary/20 bg-primary/5 text-primary">
                          {news.sentiment} Signal
                        </Badge>
                        <Text variant="label" className="text-[10px] text-muted-foreground font-mono">CONF: {news.probability}</Text>
                      </div>
                      <Text variant="body" weight="bold" className="block text-lg group-hover:text-primary transition-colors leading-tight">
                        {news.topic}
                      </Text>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Reuters / Bloomberg Source</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {news.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <Text variant="label" className="text-[8px] opacity-50 font-bold uppercase">Lifecycle</Text>
                        <Badge className={cn(
                          "border-none font-bold uppercase text-[8px] h-5 px-2",
                          news.status === 'Drafting' ? "bg-primary/10 text-primary animate-pulse" :
                          news.status === 'Review' ? "bg-amber-500/10 text-amber-500" :
                          "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {news.status}
                        </Badge>
                      </div>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-background/50 hover:bg-primary/10 hover:text-primary transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI HUB SIDEBAR */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Brain className="h-4 w-4" /> Synthesis Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Token Efficiency', value: '94.2%', color: 'text-emerald-500' },
                { label: 'Fact-Check Score', value: '99.8%', color: 'text-primary' },
                { label: 'Sourcing Precision', value: 'Master', color: 'text-secondary' },
                { label: 'Ingestion Delay', value: '420ms', color: 'text-primary' },
              ].map(v => (
                <div key={v.label} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                  <Text variant="caption" className="text-muted-foreground font-medium">{v.label}</Text>
                  <span className={cn("text-xs font-mono font-bold", v.color)}>{v.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="h-16 w-16 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest">
              <Activity className="h-4 w-4" /> Strategy Node
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "Breaking news AI is currently prioritizing **Fixed Income** wires. The 2-10 spread inversion has triggered a critical automated draft node."
            </Text>
          </div>

          <div className="p-8 rounded-[3rem] bg-card/30 border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center mx-auto shadow-2xl">
              <Terminal className="h-8 w-8 text-primary" />
            </div>
            <Text variant="bodySmall" weight="bold">LLM Orchestration</Text>
            <Text variant="caption" className="text-muted-foreground leading-relaxed block">
              Currently utilizing **Claude 3.5 Sonnet** for synthesis and **GPT-4o** for fact-checking redundancy.
            </Text>
            <Button variant="outline" className="w-full h-11 rounded-xl border-primary/20 text-primary font-bold text-xs uppercase">
              Swap AI Kernel
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
