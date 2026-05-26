/**
 * @fileOverview Global Content Quality Dashboard for platform administrators.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { getContentQualityData } from '@/services/mock-api/content-quality';
import { ContentQualityDashboardData } from '@/types/content-quality';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Zap, 
  Loader2, 
  ArrowLeft, 
  BarChart3,
  Search,
  Target,
  RefreshCw,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { QualityScoreGauge } from '@/modules/content-engine/components/QualityScoring/QualityScoreGauge';
import { QualityFactorsPanel } from '@/modules/content-engine/components/QualityScoring/QualityFactorsPanel';
import { ImprovementPanel } from '@/modules/content-engine/components/QualityScoring/ImprovementPanel';
import { TopQualityContentClient } from './TopQualityContentClient';

export default function ContentQualityDashboardPage() {
  const [data, setData] = useState<ContentQualityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getContentQualityData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Quality sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  return (
    <main className="min-h-screen bg-background pt-12 pb-24">
      <Container>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Integrity Matrix</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Content Quality Audit</Text>
            <Text variant="bodySmall" className="text-muted-foreground max-w-xl">
              Real-time monitoring of platform intelligence reliability, credibility signals, and editorial performance.
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl h-11 border-white/10 bg-card/30" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Synchronize Hub
            </Button>
            <Button className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all scale-105 active:scale-95">
              Launch Global Audit
            </Button>
          </div>
        </header>

        {/* Aggregate Quality Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="glass-card border-none shadow-xl group hover:border-emerald-500/20 transition-all">
            <CardContent className="p-6 space-y-4 text-center">
              <div className="flex flex-col items-center">
                <QualityScoreGauge score={Math.round(data.global_stats.avg_score)} size="lg" />
                <div className="mt-4 space-y-1">
                  <Text variant="label" className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Global Avg. Score</Text>
                  <div className="text-sm font-bold text-emerald-500 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" /> +2.4% vs Baseline
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
            <CardContent className="p-6 space-y-2">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Award className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold border-primary/20 text-primary uppercase">Excellent Nodes</Badge>
              </div>
              <div className="text-3xl font-bold tracking-tighter">{data.global_stats.top_tier_count}</div>
              <Text variant="label" className="text-[9px] opacity-50 uppercase font-bold tracking-widest">High-Trust Assets</Text>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl bg-destructive/5 group hover:border-destructive/20 transition-all">
            <CardContent className="p-6 space-y-2">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
                  <Zap className="h-6 w-6" />
                </div>
                <Badge variant="destructive" className="text-[8px] font-bold uppercase border-none">Needs Triage</Badge>
              </div>
              <div className="text-3xl font-bold tracking-tighter">{data.global_stats.needs_work_count}</div>
              <Text variant="label" className="text-[9px] opacity-50 uppercase font-bold tracking-widest text-destructive">Below threshold</Text>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardContent className="p-6 space-y-2">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                  <Activity className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold border-secondary/20 text-secondary uppercase">Audit Health</Badge>
              </div>
              <div className="text-3xl font-bold tracking-tighter">{data.global_stats.audit_velocity}</div>
              <Text variant="label" className="text-[9px] opacity-50 uppercase font-bold tracking-widest">Processing Speed</Text>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main List Column */}
          <div className="lg:col-span-8 space-y-10">
            <TopQualityContentClient articles={data.articles} />
          </div>

          {/* Sidebar Insights */}
          <div className="lg:col-span-4 space-y-10">
            <QualityFactorsPanel factors={data.quality_factors} />
            <ImprovementPanel suggestions={data.suggestions} />
            
            <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles className="h-16 w-16 text-primary rotate-12" />
              </div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                <Target className="h-4 w-4" /> Strategy Node
              </div>
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
                "Platforms focusing on **Macro Economics** are currently achieving the highest quality benchmarks. Recommend cross-linking top-tier Macro nodes to beginner-tier Investing guides."
              </Text>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
