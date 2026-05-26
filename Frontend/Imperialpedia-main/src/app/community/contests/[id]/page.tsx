'use client';

import React, { useEffect, useState, use } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { getPredictionContests, getContestLeaderboard } from '@/services/mock-api/community';
import { PredictionContest, ContestLeaderboardEntry } from '@/types/community';
import { PredictionForm } from '@/modules/community/components/PredictionForm';
import { ContestLeaderboard } from '@/modules/community/components/ContestLeaderboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  Trophy, 
  Users, 
  Clock, 
  Globe, 
  Activity, 
  Zap,
  Target,
  Layers,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ContestDetailsPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Individual Contest Triage Hub.
 * Orchestrates participation flows and live competitive rankings for a specific forecast node.
 */
export default function ContestDetailsPage({ params }: ContestDetailsPageProps) {
  const { id } = use(params);
  const [contest, setContest] = useState<PredictionContest | null>(null);
  const [leaderboard, setLeaderboard] = useState<ContestLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [contestsRes, leaderboardRes] = await Promise.all([
          getPredictionContests(),
          getContestLeaderboard(id)
        ]);
        const found = contestsRes.data.find(c => c.id === id);
        if (found) setContest(found);
        setLeaderboard(leaderboardRes.data);
      } catch (e) {
        console.error('Handshake failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Forecast Nodes...
        </Text>
      </div>
    );
  }

  if (!contest) {
    return (
      <Container className="py-40 text-center">
        <Text variant="h2">Contest Node Not Found</Text>
        <Button variant="link" asChild className="mt-4"><Link href="/community/contests">Back to Matrix</Link></Button>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container>
        <Button variant="ghost" size="sm" className="mb-8 p-0 hover:bg-transparent text-muted-foreground hover:text-primary group" asChild>
          <Link href="/community/contests">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Back to Challenges
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Contest Identity & Participation */}
          <div className="lg:col-span-7 space-y-10">
            <header className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                  <Trophy className="h-7 w-7" />
                </div>
                <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
                  {contest.asset} Challenge
                </Badge>
              </div>
              <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">{contest.title}</Text>
              <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                {contest.description}
              </Text>
              
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-white/5 shadow-inner">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{contest.participants.toLocaleString()} Analysts Active</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-white/5 shadow-inner">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold">Ends in 4 Days</span>
                </div>
              </div>
            </header>

            {contest.status === 'Active' ? (
              <PredictionForm asset={contest.asset} question={contest.question} />
            ) : contest.status === 'Completed' ? (
              <Card className="glass-card border-emerald-500/20 bg-emerald-500/5 p-8">
                <CardContent className="p-0 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <Text variant="h3" className="font-bold">Final Settlement Node</Text>
                      <Text variant="caption" className="text-muted-foreground font-mono">Verified Market Wire Handshake</Text>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 py-6 border-y border-emerald-500/10">
                    <div>
                      <Text variant="label" className="text-[9px] opacity-50 uppercase font-bold tracking-widest text-emerald-500">Actual Outcome</Text>
                      <div className="text-3xl font-bold tracking-tighter">{contest.outcome}</div>
                    </div>
                    <div>
                      <Text variant="label" className="text-[9px] opacity-50 uppercase font-bold tracking-widest text-primary">Winners Node</Text>
                      <div className="flex -space-x-2 mt-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold">W</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Text variant="caption" className="text-muted-foreground italic leading-relaxed block">
                    "Reputation nodes for this contest have been settled and broadcast to the identity matrix. Check your profile history for yield audit."
                  </Text>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card border-amber-500/20 bg-amber-500/5 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500">
                  <Clock className="h-8 w-8" />
                </div>
                <Text variant="h3" className="font-bold">Forecast Window Opening Soon</Text>
                <Text variant="bodySmall" className="text-muted-foreground">The data handshake for this contest starts on {contest.startDate}. Enable notifications to receive the dispatch node.</Text>
                <Button className="rounded-xl h-11 px-8 font-bold border-amber-500/20 text-amber-500" variant="outline">Set Dispatch Alert</Button>
              </Card>
            )}
          </div>

          {/* Leaderboard & Strategic Sidebar */}
          <div className="lg:col-span-5 space-y-10">
            <ContestLeaderboard entries={leaderboard} />

            <div className="p-10 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles className="h-32 w-32 text-secondary rotate-12" />
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                  <Target className="h-6 w-6" />
                </div>
                <Text variant="h4" className="font-bold">Oracle Reputation Node</Text>
              </div>
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed text-base italic">
                "Winning this contest grants you the **'Alpha Tracker'** badge and increases your discovery reach by 15% across the intelligence index."
              </Text>
              <div className="space-y-4 pt-4">
                <div className="flex justify-between text-[10px] font-bold uppercase text-secondary tracking-widest">
                  <span>Prize Pool Yield</span>
                  <span>{contest.prize || 'Badge Entry'}</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[85%] animate-pulse" />
                </div>
              </div>
            </div>

            <Card className="glass-card border-none bg-background/30 p-8 flex items-start gap-6">
              <div className="p-3 rounded-2xl bg-muted/20 text-muted-foreground">
                <Globe className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <Text variant="bodySmall" weight="bold">Global Settlement</Text>
                <Text variant="caption" className="text-muted-foreground leading-relaxed">
                  Contest results are verified against multiple institutional liquidity providers. Any data collision is resolved via the primary Imperialpedia Consensus node.
                </Text>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
