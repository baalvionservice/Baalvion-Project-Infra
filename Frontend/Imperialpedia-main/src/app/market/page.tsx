'use client';

import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Globe, 
  PieChart as PieIcon, 
  Activity, 
  ChevronRight,
  ArrowRight,
  Target,
  Sparkles,
  Search,
  Layout
} from 'lucide-react';
import Link from 'next/link';

/**
 * Integrated Market Intelligence Hub.
 * Central entry point for high-fidelity market data and institutional analytics.
 */
export default function MarketHubPage() {
  const hubs = [
    {
      title: "Market Heatmap",
      desc: "Visualize global sector performance and institutional capital flows in real-time.",
      href: "/premium/market-heatmap",
      icon: PieIcon,
      color: "text-primary",
      badge: "Institutional"
    },
    {
      title: "AI Asset Summaries",
      desc: "Consolidated intelligence nodes for individual assets, merging data with AI insights.",
      href: "/ai-analyst/asset-summary",
      icon: Layout,
      color: "text-secondary",
      badge: "AI Powered"
    },
    {
      title: "Event Intelligence",
      desc: "Monitor upcoming market catalysts and audit corporate earnings performance.",
      href: "/ai-analyst/event-intelligence",
      icon: Zap,
      color: "text-amber-500",
      badge: "Real-time"
    },
    {
      title: "Asset Screener",
      desc: "Advanced multi-vector screening for 1M+ financial assets and strategy nodes.",
      href: "/premium/screener",
      icon: Search,
      color: "text-primary",
      badge: "Pro"
    }
  ];

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <Container>
        <header className="mb-16 max-w-4xl">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Globe className="h-5 w-5" />
            <Text variant="label" className="font-bold tracking-widest uppercase">Institutional Data Matrix</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-7xl font-bold mb-6 tracking-tight">
            Market <span className="text-primary">Intelligence</span>
          </Text>
          <Text variant="body" className="text-muted-foreground text-xl leading-relaxed">
            Unrestricted access to the global financial index. Monitor sectors, audit asset nodes, and stay ahead of the curve with our institutional telemetry suite.
          </Text>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {hubs.map((hub) => (
            <Link key={hub.href} href={hub.href}>
              <Card className="glass-card p-10 hover:border-primary/40 transition-all duration-500 group h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <hub.icon size={120} />
                </div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className={cn("p-4 rounded-[2rem] bg-background/50 border border-white/5 shadow-xl group-hover:scale-110 transition-transform", hub.color)}>
                      <hub.icon className="h-8 w-8" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary px-3 h-7">{hub.badge}</Badge>
                  </div>
                  <div className="space-y-3">
                    <Text variant="h2" className="text-3xl font-bold group-hover:text-primary transition-colors">{hub.title}</Text>
                    <Text variant="body" className="text-muted-foreground leading-relaxed text-lg">{hub.desc}</Text>
                  </div>
                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">Access Hub</span>
                    <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Strategic Footer */}
        <Card className="glass-card border-none bg-primary/5 p-12 mt-20 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles className="h-12 w-12" />
            </div>
            <div className="flex-1 space-y-3 text-center lg:text-left">
              <Text variant="h2" className="text-3xl font-bold tracking-tight">AI Driven Execution</Text>
              <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
                Every market node is synchronized with our **Analyst Kernel**. Pro members receive automated alerts when structural deviations are detected in their watched sectors.
              </Text>
            </div>
            <Button size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0" asChild>
              <Link href="/ai-analyst">Launch AI Suite</Link>
            </Button>
          </div>
        </Card>
      </Container>
    </main>
  );
}

import { cn } from '@/lib/utils';
