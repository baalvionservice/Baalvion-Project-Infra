'use client';

import Link from 'next/link';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { MoverEntry } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

function MoverRow({ entry, up, websiteId }: { entry: MoverEntry; up: boolean; websiteId: string }) {
  return (
    <Link
      href={entry.symbol ? `/cms/websites/${websiteId}/news/quote/${entry.symbol}` : '#'}
      className="flex items-center justify-between rounded px-1 py-1 hover:bg-white/5"
    >
      <span className="text-xs font-medium" style={{ color: TEXT }}>{entry.symbol ?? entry.label}</span>
      <span className="flex items-center gap-0.5 text-xs font-semibold tabular-nums" style={{ color: up ? SUCCESS : DANGER }}>
        {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(entry.changePercent).toFixed(1)}%
      </span>
    </Link>
  );
}

export default function MarketMovers({ gainers, losers, websiteId }: { gainers: MoverEntry[]; losers: MoverEntry[]; websiteId: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Top Gainers</p>
        <div className="rounded-lg border" style={{ borderColor: BORDER }}>
          {gainers.length === 0
            ? <p className="px-2 py-3 text-center text-[11px]" style={{ color: MUTED }}>No data</p>
            : gainers.map((g) => <MoverRow key={g.symbol ?? g.label} entry={g} up websiteId={websiteId} />)}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Top Losers</p>
        <div className="rounded-lg border" style={{ borderColor: BORDER }}>
          {losers.length === 0
            ? <p className="px-2 py-3 text-center text-[11px]" style={{ color: MUTED }}>No data</p>
            : losers.map((l) => <MoverRow key={l.symbol ?? l.label} entry={l} up={false} websiteId={websiteId} />)}
        </div>
      </div>
    </div>
  );
}
