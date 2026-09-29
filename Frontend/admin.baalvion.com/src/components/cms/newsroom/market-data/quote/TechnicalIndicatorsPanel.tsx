'use client';

import type { TechnicalIndicators } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';
const WARNING = '#F59E0B';

const fmt = (v: number | null) => (v == null ? '—' : v.toLocaleString(undefined, { maximumFractionDigits: 2 }));

function rsiColor(rsi: number | null): string {
  if (rsi == null) return MUTED;
  if (rsi >= 70) return DANGER; // overbought
  if (rsi <= 30) return SUCCESS; // oversold
  return WARNING;
}

export default function TechnicalIndicatorsPanel({ indicators }: { indicators: TechnicalIndicators | null }) {
  if (!indicators) {
    return <p className="py-6 text-center text-xs" style={{ color: MUTED }}>Indicators unavailable for this asset type.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'SMA 20', value: indicators.sma20 },
          { label: 'SMA 50', value: indicators.sma50 },
          { label: 'SMA 200', value: indicators.sma200 },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border px-2 py-2 text-center" style={{ borderColor: BORDER }}>
            <p className="text-[10px] uppercase" style={{ color: MUTED }}>{s.label}</p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums" style={{ color: TEXT }}>{fmt(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: BORDER }}>
        <span className="text-xs" style={{ color: MUTED }}>RSI (14)</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color: rsiColor(indicators.rsi14) }}>
          {fmt(indicators.rsi14)} {indicators.rsi14 != null && (indicators.rsi14 >= 70 ? '(Overbought)' : indicators.rsi14 <= 30 ? '(Oversold)' : '')}
        </span>
      </div>

      {indicators.macd ? (
        <div className="rounded-lg border p-2" style={{ borderColor: BORDER }}>
          <p className="mb-1 text-[10px] uppercase" style={{ color: MUTED }}>MACD (12, 26, 9)</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px]" style={{ color: MUTED }}>MACD</p>
              <p className="text-xs font-semibold tabular-nums" style={{ color: TEXT }}>{fmt(indicators.macd.macdLine)}</p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: MUTED }}>Signal</p>
              <p className="text-xs font-semibold tabular-nums" style={{ color: TEXT }}>{fmt(indicators.macd.signalLine)}</p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: MUTED }}>Histogram</p>
              <p className="text-xs font-semibold tabular-nums" style={{ color: indicators.macd.histogram >= 0 ? SUCCESS : DANGER }}>
                {fmt(indicators.macd.histogram)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-[11px]" style={{ color: MUTED }}>Not enough history for MACD yet.</p>
      )}
    </div>
  );
}
