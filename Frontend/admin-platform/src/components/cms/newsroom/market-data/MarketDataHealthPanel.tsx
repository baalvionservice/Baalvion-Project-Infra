'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ProviderHealth } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const WARNING = '#F59E0B';
const DANGER = '#EF4444';

const STATUS_META: Record<string, { label: string; color: string }> = {
  ok: { label: 'Working', color: SUCCESS },
  rate_limited: { label: 'Rate Limited', color: WARNING },
  error: { label: 'Error', color: DANGER },
  unconfigured: { label: 'No Key', color: MUTED },
  unknown: { label: 'Not Checked Yet', color: MUTED },
};

const PROVIDER_LABEL: Record<string, string> = {
  finnhub: 'Finnhub',
  twelveData: 'Twelve Data',
  alphaVantage: 'Alpha Vantage',
  fred: 'FRED',
  coinGecko: 'CoinGecko',
};

// "Hidden" per spec — collapsed by default, only an editor who clicks the toggle sees it.
export default function MarketDataHealthPanel({ health }: { health: Record<string, ProviderHealth> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t pt-3" style={{ borderColor: BORDER }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium"
        style={{ color: MUTED }}
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Market Data Health
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(health).map(([provider, h]) => {
            const meta = STATUS_META[h.status] ?? STATUS_META.unknown;
            return (
              <div key={provider} className="rounded-lg border px-2.5 py-2" style={{ borderColor: BORDER }}>
                <p className="text-[11px] font-medium" style={{ color: TEXT }}>{PROVIDER_LABEL[provider] ?? provider}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold" style={{ color: meta.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                </p>
                {h.message && (
                  <p className="mt-0.5 truncate text-[9px]" style={{ color: MUTED }} title={h.message}>{h.message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
