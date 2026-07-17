'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketInstrument } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

export default function SectorPerformance({ sectors, websiteId }: { sectors: MarketInstrument[]; websiteId: string }) {
  return (
    <div className="space-y-1.5">
      {sectors.map((s) => {
        const pct = s.quote?.changePercent;
        const up = (s.quote?.change ?? 0) >= 0;
        return (
          <Link
            key={s.canonicalSymbol}
            href={`/cms/websites/${websiteId}/news/quote/${s.canonicalSymbol}`}
            className="flex items-center justify-between rounded px-1 py-1 hover:bg-white/5"
          >
            <span className="text-xs" style={{ color: TEXT }}>{s.label}</span>
            {pct != null ? (
              <span className="flex items-center gap-1 text-xs font-semibold tabular-nums" style={{ color: up ? SUCCESS : DANGER }}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? '+' : ''}{pct.toFixed(2)}%
              </span>
            ) : (
              <span className="text-[11px]" style={{ color: MUTED }}>no data</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
