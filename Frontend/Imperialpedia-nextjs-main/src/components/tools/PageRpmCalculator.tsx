'use client';

import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

type Tier = 'raw' | 'mediavine' | 'raptive';

// Published 2026 RPM ranges for website display ads — see
// calculating-page-rpm-and-session-revenue and
// display-ad-networks-mediavine-vs-raptive-vs-ezoic for sourcing. Raw AdSense
// has no single published range the way managed networks do, so it's shown
// as a qualitative note rather than a fabricated number.
const TIERS: Record<Tier, { label: string; range: [number, number] | null; note: string }> = {
  raw: { label: 'Raw AdSense (no network)', range: null, note: 'No single published range — typically well below a managed network’s RPM; varies too much by niche and ad density to benchmark as a number.' },
  mediavine: { label: 'Mediavine', range: [15, 40], note: 'Requires 50,000 sessions/30 days to qualify.' },
  raptive: { label: 'Raptive', range: [19, 55], note: 'Raptive RPMs run roughly 25–40% above Mediavine; requires 25,000 pageviews/month to qualify.' },
};

const formatUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function PageRpmCalculator() {
  const [tier, setTier] = useState<Tier>('mediavine');
  const [sessionsInput, setSessionsInput] = useState('200000');

  const sessions = Math.max(0, Number(sessionsInput.replace(/[^0-9]/g, '')) || 0);
  const t = TIERS[tier];
  const revenue = useMemo(() => {
    if (!t.range) return null;
    const [low, high] = t.range;
    return { low: (sessions / 1000) * low, high: (sessions / 1000) * high };
  }, [sessions, t]);

  return (
    <div className="not-prose my-8 border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-4 w-4 text-[#c8102e]" />
        <span className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e]">
          Website Revenue Estimator
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(TIERS) as Tier[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTier(key)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
              tier === key
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                : 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-black dark:hover:border-white'
            }`}
          >
            {TIERS[key].label}
          </button>
        ))}
      </div>

      <label htmlFor="page-rpm-sessions" className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1.5">
        Monthly sessions
      </label>
      <input
        id="page-rpm-sessions"
        type="text"
        inputMode="numeric"
        value={sessionsInput}
        onChange={(e) => setSessionsInput(e.target.value)}
        className="w-full sm:w-64 border-2 border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-lg font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none"
        placeholder="200,000"
      />

      <div className="mt-5 pt-5 border-t-2 border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
          Estimated monthly revenue
        </p>
        {revenue ? (
          <p className="text-3xl font-black text-black dark:text-white">
            {formatUsd(revenue.low)} &ndash; {formatUsd(revenue.high)}
          </p>
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300">Select a managed network to see an estimate.</p>
        )}
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{t.note}</p>
      </div>

      <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed">
        Estimate only — real RPM varies by niche, traffic source, ad density, and seasonality (Q4
        commonly runs 40–60% above average). Ranges compiled from published 2026 ad-network rate
        trackers.
      </p>
    </div>
  );
}
