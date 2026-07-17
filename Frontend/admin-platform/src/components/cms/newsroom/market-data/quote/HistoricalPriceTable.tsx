'use client';

import type { QuoteChartPoint } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function HistoricalPriceTable({ rows }: { rows: QuoteChartPoint[] }) {
  const recent = [...rows].reverse().slice(0, 20); // newest first, most recent 20 bars

  if (recent.length === 0) {
    return <p className="py-6 text-center text-xs" style={{ color: MUTED }}>No historical data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: BORDER }}>
            {['Date', 'Open', 'High', 'Low', 'Close', 'Volume'].map((h) => (
              <th key={h} className="px-2 py-1.5 font-medium" style={{ color: MUTED }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recent.map((row, i) => {
            const prevClose = recent[i + 1]?.close;
            const up = prevClose != null ? row.close >= prevClose : true;
            return (
              <tr key={row.date} className="border-b last:border-b-0" style={{ borderColor: BORDER }}>
                <td className="px-2 py-1.5" style={{ color: TEXT }}>{row.date}</td>
                <td className="px-2 py-1.5 tabular-nums" style={{ color: MUTED }}>{fmt(row.open)}</td>
                <td className="px-2 py-1.5 tabular-nums" style={{ color: MUTED }}>{fmt(row.high)}</td>
                <td className="px-2 py-1.5 tabular-nums" style={{ color: MUTED }}>{fmt(row.low)}</td>
                <td className="px-2 py-1.5 font-semibold tabular-nums" style={{ color: up ? SUCCESS : DANGER }}>{fmt(row.close)}</td>
                <td className="px-2 py-1.5 tabular-nums" style={{ color: MUTED }}>{row.volume != null ? row.volume.toLocaleString() : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
