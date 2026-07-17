'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { KpiStat } from '@/lib/newsroom/stats';

interface Props {
  stat: KpiStat;
  icon: LucideIcon;
}

export default function KpiCard({ stat, icon: Icon }: Props) {
  const sparkData = stat.sparkline.map((v, i) => ({ i, v }));

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-4 transition-transform hover:-translate-y-0.5"
      style={{ background: '#181C22', borderColor: '#242A33' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
            {stat.label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: '#F5F7FA' }}>
            {stat.value.toLocaleString()}
          </p>
          {stat.trendPct !== null && (
            <p
              className="mt-1 flex items-center gap-0.5 text-xs font-medium"
              style={{ color: stat.trendPct >= 0 ? '#16C784' : '#EF4444' }}
            >
              {stat.trendPct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(stat.trendPct)}%
            </p>
          )}
        </div>
        <Icon className="h-4 w-4 shrink-0" style={{ color: stat.color }} />
      </div>

      {sparkData.some((d) => d.v > 0) && (
        <div className="mt-2 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <Line type="monotone" dataKey="v" stroke={stat.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
