'use client';

import Link from 'next/link';
import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { Search, FileWarning, AlignLeft, Globe2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import type { SeoOverview as SeoData } from './dashboard-data';

interface Props {
  data: SeoData;
  seoHref: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'hsl(142 71% 45%)';
  if (score >= 60) return 'hsl(38 92% 50%)';
  return 'hsl(0 72% 51%)';
}

export default function SeoOverview({ data, seoHref }: Props) {
  const color = scoreColor(data.score);
  const chart = [{ name: 'score', value: data.score, fill: color }];

  const rows = [
    { icon: Globe2, label: 'Indexed pages', value: data.indexedPages, color: 'text-green-500' },
    { icon: FileWarning, label: 'Missing meta titles', value: data.missingTitles, color: 'text-amber-500' },
    { icon: AlignLeft, label: 'Missing descriptions', value: data.missingDescriptions, color: 'text-rose-500' },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Search className="h-4 w-4 text-rose-500" />
          SEO Overview
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
          <Link href={seoHref}>
            Manage
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="72%"
              outerRadius="100%"
              data={chart}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" style={{ color }}>
              {data.score}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Score
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="flex items-center gap-2">
                <Icon className={cn('h-3.5 w-3.5 shrink-0', r.color)} />
                <span className="flex-1 text-xs text-muted-foreground">{r.label}</span>
                <span className="text-sm font-semibold tabular-nums">{formatNumber(r.value)}</span>
              </div>
            );
          })}
          {data.sampleSize > 0 && (
            <p className="pt-1 text-[10px] text-muted-foreground">
              Meta health measured across {data.sampleSize} recent items.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
