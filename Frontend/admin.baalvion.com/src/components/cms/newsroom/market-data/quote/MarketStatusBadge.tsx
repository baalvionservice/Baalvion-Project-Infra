'use client';

import type { QuoteMarketStatus } from '@/lib/types/market-data.types';

const SUCCESS = '#16C784';
const WARNING = '#F59E0B';
const MUTED = '#9CA3AF';
const DANGER = '#EF4444';

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: SUCCESS },
  'pre-market': { label: 'Pre-Market', color: WARNING },
  'after-hours': { label: 'After Hours', color: WARNING },
  closed: { label: 'Closed', color: DANGER },
};

export default function MarketStatusBadge({ marketStatus }: { marketStatus: QuoteMarketStatus }) {
  const meta = STATUS_META[marketStatus.status] ?? { label: marketStatus.label, color: MUTED };
  // Crypto's label is "24/7" (more informative than "Open") — show it as-is.
  const displayLabel = marketStatus.label === '24/7' ? '24/7' : meta.label;
  return (
    <span
      className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{ borderColor: meta.color, color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {displayLabel}
    </span>
  );
}
