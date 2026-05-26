'use client';

import React, { useEffect, useState } from 'react';
import { CommunityData, DebateNode, DebateLeaderboardEntry } from '@/types/community';
import { communityService } from '@/services/data/community-service';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Scale, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Activity, 
  Loader2, 
  Search, 
  Filter, 
  ArrowRight,
  Sparkles,
  Layers,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DebateCard } from '@/modules/community/components/DebateCard';
import { cn } from '@/lib/utils';

/**
 * Financial Debate Rooms Dashboard Client.
 * Orchestrates structured market debates and expert duels.
 */
export function DebatesClient() {
  const [debates, setDebates] = useState<DebateNode[]>([]);
  const [leaderboard, setLeaderboard] = useState<DebateLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [debatesRes, leaderboardRes] = await Promise.all([
          communityService.getDebates(),
          communityService.getDebateLeaderboard()
        ]);
        if (debatesRes.data) setDebates(debatesRes.data);
        if (leaderboardRes.data) setLeaderboard(leaderboardRes.data);
      } catch (e) {
        console.error('Handshake failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredDebates = debates.filter(d => 
    d.topic.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Debate Nodes...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Scale className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Structured Market Conflict</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Market Debate Arena</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1 text-base max-w-xl">
            Audit the clash of ideas. Explore structured debates between leading bulls and bears across every indexed taxonomy.
          </Text>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search debate topics..." 
              className="pl-10 h-11 bg-card/30 border-white/10 rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
            Open New Room
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* MAIN DEBATE DISCOVERY */}
        <div className="lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredDebates.map(debate => (
              <DebateCard key={debate.id} debate={debate} />
            ))}
          </div>

          <div className="p-10 rounded-[3rem] bg-primary/5 border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="h-32 w-32 text-primary" />
            </div>
            <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <Zap className="h-4 w-4" /> Strategic Triage
            </div>
            <Text variant="body" className="text-foreground/90 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-6 py-2">
              "The most impactful debates occur in the **Macro Hub**. Participants with a 90%+ prediction accuracy receive priority placement in active rooms."
            </Text>
            <Button variant="link" className="mt-6 p-0 h-auto text-primary font-bold text-xs uppercase group/link" asChild>
              <a href="/community/reputation">
                Audit My Reputation <ChevronRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </a>
            </Button>
          </div>
        </div>

        {/* SIDEBAR: LEADERBOARD & STATS */}
        <aside className="lg:col-span-4 space-y-10">
          {/* Debater Leaderboard */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Top Debaters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {leaderboard.map((user) => (
                  <div key={user.name} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground w-4">#{user.rank}</span>
                      <Avatar className="h-8 w-8 rounded-lg border border-white/5">
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold group-hover:text-primary transition-colors">{user.name}</span>
                        <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Reputation: {user.reputation}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] font-mono font-bold">
                      {user.debates_won} Wins
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full h-10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none border-t border-white/5">
                View Full Hall of Fame
              </Button>
            </CardContent>
          </Card>

          {/* Strategic Context */}
          <div className="p-8 rounded-[2.5rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
              <Activity className="h-24 w-24 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Layers className="h-4 w-4" /> Debate Protocol
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "Structured debates utilize the **Dialectical Verification** engine. Arguments are cross-referenced with institutional data points to prevent misinformation traversal."
            </Text>
          </div>

          <Card className="glass-card border-none bg-background/30 shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Arena Vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <Text variant="caption" className="text-muted-foreground">Active Duels</Text>
                <span className="text-xs font-bold font-mono text-primary">{debates.filter(d => d.status === 'Active').length} Nodes</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <Text variant="caption" className="text-muted-foreground">Argument Velocity</Text>
                <span className="text-xs font-bold font-mono text-emerald-500">+124/hr</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <Text variant="caption" className="text-muted-foreground">Global Consensus</Text>
                <span className="text-xs font-bold font-mono text-foreground">62% Neutral</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
