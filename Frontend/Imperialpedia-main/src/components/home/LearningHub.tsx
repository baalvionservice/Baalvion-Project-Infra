'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, TrendingUp, Cpu, Globe } from 'lucide-react';
import Link from 'next/link';

export function LearningHub() {
  const hubs = [
    { title: 'What is Inflation?', desc: 'Understand how currency erosion affects global purchasing power and capital preservation.', icon: Globe, color: 'text-primary' },
    { title: 'Stock Market Basics', desc: 'Audit the foundational mechanics of equity trading and institutional capital flows.', icon: TrendingUp, color: 'text-secondary' },
    { title: 'Crypto Explained', desc: 'Deconstruct the architecture of decentralized finance and digital sovereign assets.', icon: Cpu, color: 'text-emerald-500' },
  ];

  return (
    <section className="space-y-10">
      <header className="max-w-2xl px-2 space-y-2">
        <div className="flex items-center gap-3 text-secondary mb-1">
          <GraduationCap className="h-5 w-5" />
          <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Structured Education</Text>
        </div>
        <Text variant="h2" className="text-2xl lg:text-3xl font-bold">Featured Learning Hub</Text>
        <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
          Accelerate your financial literacy with our curated intelligence paths.
        </Text>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {hubs.map((hub) => (
          <Card key={hub.title} className="glass-card border-none shadow-xl hover:border-secondary/30 transition-all duration-500 group overflow-hidden h-full flex flex-col">
            <CardHeader className="p-8 pb-4">
              <div className={cn("p-4 rounded-2xl bg-background/50 border border-white/5 w-fit mb-6 transition-transform group-hover:scale-110", hub.color)}>
                <hub.icon className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-bold leading-tight group-hover:text-secondary transition-colors">
                {hub.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-2 flex-grow">
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed text-base">
                {hub.desc}
              </Text>
            </CardContent>
            <div className="p-8 pt-0 mt-auto">
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-white/10 group/btn" asChild>
                <Link href="/learning-paths">
                  Enter Path <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

import { cn } from '@/lib/utils';
