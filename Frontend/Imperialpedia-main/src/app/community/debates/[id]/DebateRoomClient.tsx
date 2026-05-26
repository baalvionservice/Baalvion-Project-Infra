'use client';

import React, { useEffect, useState } from 'react';
import { DebateNode } from '@/types/community';
import { communityService } from '@/services/data/community-service';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  Info,
  ChevronRight,
  MessageSquare,
  Users,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArgumentCard } from '@/modules/community/components/ArgumentCard';
import { DebateTimeline } from '@/modules/community/components/DebateTimeline';
import { toast } from '@/hooks/use-toast';

interface DebateRoomClientProps {
  id: string;
}

/**
 * Split-screen Debate Room Client Hub.
 * Features hierarchical bull/bear arguments, community voting, and event timeline.
 */
export function DebateRoomClient({ id }: DebateRoomClientProps) {
  const [debate, setDebate] = useState<DebateNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<'bull' | 'bear' | 'neutral' | null>(null);

  useEffect(() => {
    async function loadDebate() {
      try {
        const response = await communityService.getDebates();
        const found = response.data.find(d => d.id === id);
        if (found) setDebate(found);
      } catch (e) {
        console.error('Handshake failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadDebate();
  }, [id]);

  const handleVote = (side: 'bull' | 'bear' | 'neutral') => {
    setUserVote(side);
    toast({
      title: "Consensus Node Registered",
      description: `Your vote for the ${side} side has been synchronized with the index.`,
    });
  };

  if (loading || !debate) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Arena Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      <header className="space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent text-muted-foreground hover:text-primary group" asChild>
          <Link href="/community/debates">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Back to Arena
          </Link>
        </Button>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Scale className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3">
              {debate.category} Debate
            </Badge>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">{debate.topic}</Text>
        </div>
      </header>

      {/* TOP SUMMARY & VOTING HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="glass-card border-none bg-primary/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Target className="h-64 w-64 text-primary" />
            </div>
            <CardContent className="p-10 space-y-8 relative z-10">
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-3xl bg-primary/10 text-primary shrink-0 shadow-lg">
                  <Info className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <Text variant="h3" className="text-2xl font-bold">Debate Summary</Text>
                  <Text variant="body" className="text-muted-foreground leading-relaxed italic text-lg">
                    "{debate.summary}"
                  </Text>
                </div>
              </div>

              {/* Community Voting Logic */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex justify-between items-end">
                  <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest text-primary">Community Opinion Matrix</Text>
                  <div className="flex gap-4 text-[9px] font-mono font-bold uppercase">
                    <span className="text-emerald-500">{debate.community_votes.bull}% Bullish</span>
                    <span className="text-destructive">{debate.community_votes.bear}% Bearish</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-muted/20 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: `${debate.community_votes.bull}%` }} />
                  <div className="h-full bg-white/5" style={{ width: `${debate.community_votes.neutral}%` }} />
                  <div className="h-full bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-1000" style={{ width: `${debate.community_votes.bear}%` }} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => handleVote('bull')}
                    className={cn(
                      "flex-1 h-11 rounded-xl font-bold text-xs uppercase transition-all",
                      userVote === 'bull' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                    )}
                  >
                    Bull Case Wins
                  </Button>
                  <Button 
                    onClick={() => handleVote('bear')}
                    className={cn(
                      "flex-1 h-11 rounded-xl font-bold text-xs uppercase transition-all",
                      userVote === 'bear' ? "bg-destructive text-white shadow-lg shadow-red-900/40" : "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                    )}
                  >
                    Bear Case Wins
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => handleVote('neutral')}
                    className={cn(
                      "flex-1 h-11 rounded-xl font-bold text-xs uppercase",
                      userVote === 'neutral' && "bg-muted"
                    )}
                  >
                    Undecided
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none shadow-xl h-full">
            <CardHeader className="pb-4 bg-card/30 border-b border-white/5">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Clock className="h-4 w-4" /> Event Evolution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <DebateTimeline events={debate.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SPLIT SCREEN ARGUMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* BULLISH WING */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <Text variant="h3" className="font-bold">Bullish Intelligence</Text>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-mono text-[10px] px-3">{debate.bull_participants} Nodes</Badge>
          </div>
          
          <div className="space-y-6">
            {debate.bull_arguments.map(arg => (
              <ArgumentCard key={arg.id} argument={arg} side="bull" />
            ))}
            <Button variant="ghost" className="w-full h-14 rounded-2xl border-2 border-dashed border-white/5 text-muted-foreground hover:text-emerald-500 font-bold hover:bg-emerald-500/5 group">
              <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" /> Add Bullish Counter-Node
            </Button>
          </div>
        </div>

        {/* BEARISH WING */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <TrendingDown className="h-5 w-5" />
              </div>
              <Text variant="h3" className="font-bold">Bearish Intelligence</Text>
            </div>
            <Badge variant="secondary" className="bg-destructive/10 text-destructive border-none font-mono text-[10px] px-3">{debate.bear_participants} Nodes</Badge>
          </div>

          <div className="space-y-6">
            {debate.bear_arguments.map(arg => (
              <ArgumentCard key={arg.id} argument={arg} side="bear" />
            ))}
            <Button variant="ghost" className="w-full h-14 rounded-2xl border-2 border-dashed border-white/5 text-muted-foreground hover:text-destructive font-bold hover:bg-destructive/5 group">
              <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" /> Add Bearish Counter-Node
            </Button>
          </div>
        </div>
      </div>

      {/* STRATEGIC HUB FOOTER */}
      <footer className="mt-24 p-12 rounded-[3.5rem] bg-secondary/5 border border-secondary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
          <ShieldCheck className="h-64 w-64 text-secondary" />
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-secondary/20 flex items-center justify-center text-secondary shadow-2xl shrink-0">
            <Users className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <Text variant="h2" className="text-2xl font-bold">Participatory Meritocracy</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-2xl text-base">
              Debate rooms utilize the **Instructional Consensus** algorithm. The winning arguments are archived in the primary Intelligence Index, boosting the debater's reputation across the 1M+ programmatic nodes.
            </Text>
          </div>
          <Button variant="outline" className="h-12 px-10 rounded-xl font-bold border-secondary/30 hover:bg-secondary/5 shrink-0" asChild>
            <Link href="/community/rankings">Hall of Fame</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}

import { Plus } from 'lucide-react';
