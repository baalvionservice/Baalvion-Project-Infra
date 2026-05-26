'use client';

import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  Trophy, 
  Target, 
  Scale, 
  Activity, 
  ArrowRight,
  ChevronRight,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Integrated Community Hub.
 * Central entry point for crowdsourced intelligence, debates, and meritocracy rankings.
 */
export default function CommunityHubPage() {
  const modules = [
    {
      title: "Market Sentiment",
      desc: "Track real-time crowd perception and participating in Bull vs Bear consensus loops.",
      href: "/community/sentiment",
      icon: Activity,
      color: "text-primary",
      badge: "Live Pulse"
    },
    {
      title: "Debate Arena",
      desc: "Structured market clashes between leading analysts across every indexed taxonomy.",
      href: "/community/debates",
      icon: Scale,
      color: "text-secondary",
      badge: "Structured"
    },
    {
      title: "Discovery Forums",
      desc: "Expert-led discussions and tactical research threads for high-scale engagement.",
      href: "/community/discussions",
      icon: MessageSquare,
      color: "text-primary",
      badge: "Dialogue"
    },
    {
      title: "Network Rankings",
      desc: "Explore the platform meritocracy. See top-ranking analysts and expert contributors.",
      href: "/community/rankings",
      icon: Trophy,
      color: "text-amber-500",
      badge: "Authority"
    }
  ];

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <Container>
        <header className="mb-16 max-w-4xl">
          <div className="flex items-center gap-2 text-secondary mb-4">
            <Users className="h-5 w-5" />
            <Text variant="label" className="font-bold tracking-widest uppercase">Crowdsourced Intelligence Network</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-7xl font-bold mb-6 tracking-tight">
            Community <span className="text-secondary">Hub</span>
          </Text>
          <Text variant="body" className="text-muted-foreground text-xl leading-relaxed">
            Collaborate with the world's leading financial contributors. Contribute your analysis, participate in predictive contests, and build your institutional reputation.
          </Text>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modules.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="glass-card p-10 hover:border-secondary/40 transition-all duration-500 group h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <mod.icon size={120} />
                </div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className={cn("p-4 rounded-[2rem] bg-background/50 border border-white/5 shadow-xl group-hover:scale-110 transition-transform", mod.color)}>
                      <mod.icon className="h-8 w-8" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-secondary/20 bg-secondary/5 text-secondary px-3 h-7">{mod.badge}</Badge>
                  </div>
                  <div className="space-y-3">
                    <Text variant="h2" className="text-3xl font-bold group-hover:text-secondary transition-colors">{mod.title}</Text>
                    <Text variant="body" className="text-muted-foreground leading-relaxed text-lg">{mod.desc}</Text>
                  </div>
                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">Enter Arena</span>
                    <ArrowRight className="h-5 w-5 text-secondary opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Gamification Node */}
        <div className="mt-20 p-12 rounded-[3.5rem] bg-secondary/5 border border-secondary/20 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <Trophy className="h-64 w-64 text-secondary" />
          </div>
          <div className="w-24 h-24 rounded-[2.5rem] bg-secondary/20 flex items-center justify-center text-secondary shadow-2xl shrink-0 group-hover:scale-110 transition-transform">
            <Target className="h-12 w-12" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-3 relative z-10">
            <Text variant="h2" className="text-3xl font-bold">Predictive Meritocracy</Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
              Earn **Reputation Nodes** by winning prediction contests and providing helpful analysis. Top contributors are fast-tracked for expert verification and monetization.
            </Text>
          </div>
          <Button size="lg" variant="outline" className="h-14 px-10 rounded-2xl font-bold border-secondary/30 text-secondary hover:bg-secondary/5 shrink-0 relative z-10" asChild>
            <Link href="/community/contests">Explore Active Contests</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
