'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketInstrument } from '@/lib/types/market-data.types';
import { secondsSince, formatAgo } from '@/lib/newsroom/marketDataFormat';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

export default function MarketTicker({ item, nowMs, websiteId }: { item: MarketInstrument; nowMs: number; websiteId: string }) {
  const q = item.quote;
  const value = q?.price ?? q?.value;
  const up = (q?.change ?? 0) >= 0;
  const ago = formatAgo(secondsSince(q?.fetchedAt, nowMs));

  return (
    <Link href={`/cms/websites/${websiteId}/news/quote/${item.canonicalSymbol}`} className="block hover:bg-white/5">
      <div className="flex items-center justify-between border-b py-1.5 last:border-b-0" style={{ borderColor: BORDER }}>
        <span className="truncate text-xs" style={{ color: TEXT }}>{item.label}</span>
        <div className="text-right">
          {q && value != null ? (
            <>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-semibold tabular-nums" style={{ color: TEXT }}>
                  {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="flex items-center gap-0.5 text-[11px] font-medium tabular-nums" style={{ color: up ? SUCCESS : DANGER }}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {q.change != null && `${up ? '+' : ''}${q.change.toFixed(2)}`}
                  {q.changePercent != null && ` (${up ? '+' : ''}${q.changePercent.toFixed(2)}%)`}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: MUTED }}>{item.source} · Updated {ago}</p>
            </>
          ) : (
            <span className="text-[11px]" style={{ color: MUTED }}>no data</span>
          )}
        </div>
      </div>
    </Link>
  );
}
