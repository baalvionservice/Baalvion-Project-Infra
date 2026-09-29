'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatNumber } from '@/lib/utils/format';
import type { PublishingAnalytics as PublishingData } from './dashboard-data';

interface Props {
  data: PublishingData;
}

const TILES: Array<{ key: keyof Omit<PublishingData, 'trend'>; label: string; color: string }> = [
  { key: 'today', label: 'Today', color: 'text-blue-500' },
  { key: 'thisWeek', label: 'This Week', color: 'text-violet-500' },
  { key: 'thisMonth', label: 'This Month', color: 'text-emerald-500' },
];

export default function PublishingAnalytics({ data }: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Publishing Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {TILES.map((t) => (
            <div key={t.key} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t.label}
              </p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${t.color}`}>
                {formatNumber(data[t.key])}
              </p>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <p className="mb-1 text-[11px] text-muted-foreground">Last 14 days · items published</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data.trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="cmsPublishGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d, 'MMM d')}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelFormatter={(l) => formatDate(l, 'MMM d, yyyy')}
                formatter={(v: number) => [formatNumber(v), 'Published']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(221.2 83.2% 53.3%)"
                strokeWidth={2}
                fill="url(#cmsPublishGradient)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
