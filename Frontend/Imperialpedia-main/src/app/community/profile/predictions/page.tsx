'use client';

import React, { useEffect, useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { getUserPredictions } from '@/services/mock-api/community';
import { UserPrediction } from '@/types/community';
import { PredictionHistory } from '@/modules/community/components/PredictionHistory';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Loader2, 
  Activity, 
  Target, 
  Zap, 
  Globe,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

/**
 * User Prediction Dashboard (Personal History).
 * Specialized suite for auditing personal forecast accuracy and reputation yields.
 */
export default function UserPredictionsPage() {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getUserPredictions();
        if (response.data) setPredictions(response.data);
      } catch (e) {
        console.error('History sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Retrieving Personal Alpha...
        </Text>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-12 pb-32">
      <Container>
        <Button variant="ghost" size="sm" className="mb-8 p-0 hover:bg-transparent text-muted-foreground hover:text-primary group" asChild>
          <Link href="/community/contests">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
            Back to Arena
          </Link>
        </Button>

        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary border border-secondary/20">
              <Target className="h-5 w-5" />
            </div>
            <Text variant="label" className="font-bold tracking-widest text-secondary">Analyst Performance Ledger</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">My Forecast History</Text>
          <Text variant="body" className="text-muted-foreground text-lg max-w-2xl mt-2 leading-relaxed">
            Audit your historical precision across global market contests. Every correct prediction strengthens your reputation node and platform authority.
          </Text>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-9">
            <PredictionHistory predictions={predictions} />
          </div>

          <aside className="lg:col-span-3 space-y-8">
            <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Zap className="h-16 w-16 text-primary" />
              </div>
              <Text variant="h4" className="font-bold text-primary flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4" /> Authority Node
              </Text>
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
                "Maintaining an accuracy rate above 75% unlocks the **Expert Triage** capability, allowing you to suggest new contest parameters to the system leads."
              </Text>
            </Card>

            <div className="p-8 rounded-[2.5rem] bg-card/30 border border-white/5 text-center space-y-4">
              <div className="w-16 h-16 rounded-[1.5rem] bg-secondary/10 flex items-center justify-center text-secondary mx-auto">
                <Activity className="h-8 w-8" />
              </div>
              <Text variant="bodySmall" weight="bold">Precision Trending</Text>
              <Text variant="caption" className="text-muted-foreground leading-relaxed block">
                Your forecasting velocity has increased by **12%** this cycle. Keep participating to reach the next authority tier.
              </Text>
              <Button variant="link" className="text-secondary font-bold text-xs group" asChild>
                <Link href="/community/leaderboard">
                  Global Authority Hub <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
