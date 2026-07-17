'use client';

import type { PerformanceSummary as PerformanceSummaryType } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

const ROWS: { key: keyof PerformanceSummaryType; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'ytd', label: 'YTD' },
  { key: 'oneYear', label: '1 Year' },
  { key: 'fiveYear', label: '5 Year' },
];

export default function PerformanceSummary({ performance }: { performance: PerformanceSummaryType }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {ROWS.map(({ key, label }) => {
        const v = performance[key];
        const up = (v ?? 0) >= 0;
        return (
          <div key={key} className="rounded-lg border px-2 py-2 text-center" style={{ borderColor: BORDER }}>
            <p className="text-[10px] uppercase" style={{ color: MUTED }}>{label}</p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums" style={{ color: v == null ? MUTED : up ? SUCCESS : DANGER }}>
              {v == null ? '—' : `${up ? '+' : ''}${v.toFixed(2)}%`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
