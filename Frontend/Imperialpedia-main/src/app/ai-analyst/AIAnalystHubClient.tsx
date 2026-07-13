'use client';

import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  Globe,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  GitCompare,
  Gauge,
  Layers,
  Newspaper,
  PieChart,
  MessageCircle,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Integrated AI Analyst Hub.
 * Central entry point for all generative AI financial flows.
 */
export default function AIAnalystHubPage() {
  const tools = [
    {
      title: "Automated Market Recap",
      desc: "AI-generated synthesis of the day's price action, volume, and standout movers.",
      href: "/ai-analyst/automated-recap",
      icon: Activity,
      color: "text-primary",
      badge: "Automation"
    },
    {
      title: "Bull Case Generator",
      desc: "Build a data-backed bullish thesis for any asset in seconds.",
      href: "/ai-analyst/bull-case",
      icon: TrendingUp,
      color: "text-emerald-500",
      badge: "Bull Case"
    },
    {
      title: "Bear Case Generator",
      desc: "Surface the downside risks and bearish thesis for any asset.",
      href: "/ai-analyst/bear-case",
      icon: TrendingDown,
      color: "text-destructive",
      badge: "Bear Case"
    },
    {
      title: "Asset Comparison",
      desc: "Head-to-head AI comparison of fundamentals, valuation, and momentum.",
      href: "/ai-analyst/compare",
      icon: GitCompare,
      color: "text-secondary",
      badge: "Comparison"
    },
    {
      title: "Multi-Asset Comparison",
      desc: "Compare a full basket of assets side-by-side across key metrics.",
      href: "/ai-analyst/multi-compare",
      icon: Layers,
      color: "text-secondary",
      badge: "Multi-Asset"
    },
    {
      title: "Macro Economic Summary",
      desc: "AI synthesis of macro indicators, central bank policy, and global signals.",
      href: "/ai-analyst/macro-summary",
      icon: Globe,
      color: "text-primary",
      badge: "Macro"
    },
    {
      title: "Sector Overview",
      desc: "Rotate through sector performance, leaders, and laggards at a glance.",
      href: "/ai-analyst/sector-overview",
      icon: PieChart,
      color: "text-amber-500",
      badge: "Sector"
    },
    {
      title: "News Summary Generator",
      desc: "Condenses breaking financial news into concise, actionable briefs.",
      href: "/ai-analyst/news-summary",
      icon: Newspaper,
      color: "text-primary",
      badge: "News"
    },
    {
      title: "Social Sentiment Tracker",
      desc: "Tracks social and retail sentiment shifts across tracked assets.",
      href: "/ai-analyst/social-sentiment",
      icon: MessageCircle,
      color: "text-emerald-500",
      badge: "Sentiment"
    },
    {
      title: "Weekly Digest Generator",
      desc: "A single AI-curated recap of the week's most important market moves.",
      href: "/ai-analyst/weekly-digest",
      icon: CalendarDays,
      color: "text-primary",
      badge: "Digest"
    },
    {
      title: "Model Performance Report",
      desc: "Transparency report on AI analyst model accuracy and conviction tracking.",
      href: "/ai-analyst/model-performance",
      icon: Gauge,
      color: "text-destructive",
      badge: "Performance"
    }
  ];

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <Container>
        <header className="mb-16 max-w-4xl">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Sparkles className="h-5 w-5" />
            <Text variant="label" className="font-bold tracking-widest uppercase">Generative Intelligence Suite</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-7xl font-bold mb-6 tracking-tight">
            AI <span className="text-primary">Analyst Hub</span>
          </Text>
          <Text variant="body" className="text-muted-foreground text-xl leading-relaxed">
            Harness the power of institutional-grade AI. Our generative engine processes millions of nodes across the Imperialpedia Index to provide actionable, data-driven intelligence.
          </Text>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <Card className="glass-card p-8 hover:border-primary/40 transition-all duration-500 group h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <tool.icon size={80} />
                </div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("p-3 rounded-2xl bg-background/50 border border-white/5 shadow-lg group-hover:scale-110 transition-transform", tool.color)}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary h-5 px-2">{tool.badge}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Text variant="h3" className="text-xl font-bold group-hover:text-primary transition-colors">{tool.title}</Text>
                    <Text variant="bodySmall" className="text-muted-foreground leading-relaxed line-clamp-2">{tool.desc}</Text>
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">Launch Engine</span>
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Integration Callout */}
        <div className="mt-24 p-12 rounded-[3.5rem] bg-primary/5 border border-primary/20 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Zap className="h-64 w-64 text-primary" />
          </div>
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Activity className="h-10 w-10 animate-pulse" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-3 relative z-10">
            <Text variant="h2" className="text-3xl font-bold">Integrated Intelligence Matrix</Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
              All AI outputs are cross-referenced with the **Knowledge Graph**. Identify conceptual relationships and verify analyst conviction scores against real-time market data nodes.
            </Text>
          </div>
          <Button size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 relative z-10" asChild>
            <Link href="/knowledge-map">Explore Knowledge Map</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
