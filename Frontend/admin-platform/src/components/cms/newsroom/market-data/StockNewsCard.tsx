'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Newspaper } from 'lucide-react';
import type { MarketInstrument } from '@/lib/types/market-data.types';
import { secondsSince, formatAgo } from '@/lib/newsroom/marketDataFormat';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

export default function StockNewsCard({ item, nowMs, websiteId }: { item: MarketInstrument; nowMs: number; websiteId: string }) {
  const q = item.quote;
  const up = (q?.change ?? 0) >= 0;
  const ago = formatAgo(secondsSince(q?.fetchedAt, nowMs));
  const news = item.relatedNews ?? [];

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: BORDER }}>
      <Link href={`/cms/websites/${websiteId}/news/quote/${item.canonicalSymbol}`} className="flex items-center justify-between gap-2 hover:opacity-80">
        <span className="truncate text-xs font-semibold" style={{ color: TEXT }}>{item.label}</span>
        {q?.price != null ? (
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums" style={{ color: up ? SUCCESS : DANGER }}>
            ${q.price.toFixed(2)}
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {q.changePercent != null && `${q.changePercent.toFixed(2)}%`}
          </span>
        ) : (
          <span className="shrink-0 text-[11px]" style={{ color: MUTED }}>no data</span>
        )}
      </Link>
      {q && <p className="mt-0.5 text-[10px]" style={{ color: MUTED }}>{item.source} · Updated {ago}</p>}
      {news.length > 0 && (
        <div className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: BORDER }}>
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase" style={{ color: MUTED }}>
            <Newspaper className="h-3 w-3" /> Latest News
          </p>
          {news.map((n) => (
            <Link
              key={n.id}
              href={`/cms/websites/${websiteId}/content/${n.id}`}
              className="block truncate text-[11px] hover:underline"
              style={{ color: TEXT }}
            >
              • {n.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
