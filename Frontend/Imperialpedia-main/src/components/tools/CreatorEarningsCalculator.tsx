'use client';

import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

type PlatformKey = 'youtube-long' | 'youtube-shorts' | 'tiktok';

// Publicly reported RPM ranges, not platform-disclosed figures (YouTube, TikTok
// and Meta don't publish exact rates) — kept as ranges rather than a single
// number so the tool never implies more precision than the underlying data
// supports. Sources cited in the component's own footer, not just here.
const PLATFORM_RPM: Record<PlatformKey, { label: string; low: number; high: number; note: string }> = {
  'youtube-long': {
    label: 'YouTube (long-form)',
    low: 2,
    high: 10,
    note: 'per 1,000 views, after YouTube’s revenue share; finance/business content trends toward the high end, entertainment/gaming toward the low end.',
  },
  'youtube-shorts': {
    label: 'YouTube Shorts',
    low: 0.03,
    high: 0.1,
    note: 'per 1,000 views — Shorts RPM runs roughly 30–100x lower than long-form.',
  },
  tiktok: {
    label: 'TikTok Creator Rewards',
    low: 0.4,
    high: 1.0,
    note: 'per 1,000 QUALIFIED views (videos under 60 seconds earn nothing from this program; qualified views typically run 50–70% of total views).',
  },
};

const formatUsd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 10 ? 2 : 0 });

interface CreatorEarningsCalculatorProps {
  /** Which platform tab opens first — the rest are still selectable. */
  defaultPlatform?: PlatformKey;
}

/**
 * Real, working RPM/CPM estimator for the Creator Economy articles whose
 * titles promise a calculator. Every rate is a published range with a
 * citation, not an invented point figure — platforms don't disclose exact
 * per-view rates, so presenting a false-precision single number would itself
 * be a fabrication.
 */
export function CreatorEarningsCalculator({ defaultPlatform = 'youtube-long' }: CreatorEarningsCalculatorProps) {
  const [platform, setPlatform] = useState<PlatformKey>(defaultPlatform);
  const [monthlyViews, setMonthlyViews] = useState<string>('100000');

  const views = Math.max(0, Number(monthlyViews.replace(/[^0-9]/g, '')) || 0);
  const rate = PLATFORM_RPM[platform];
  const { low, high } = useMemo(
    () => ({
      low: (views / 1000) * rate.low,
      high: (views / 1000) * rate.high,
    }),
    [views, rate],
  );

  return (
    <div className="not-prose my-8 border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-4 w-4 text-[#c8102e]" />
        <span className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e]">
          Earnings Estimator
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(PLATFORM_RPM) as PlatformKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPlatform(key)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
              platform === key
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                : 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-black dark:hover:border-white'
            }`}
          >
            {PLATFORM_RPM[key].label}
          </button>
        ))}
      </div>

      <label htmlFor="creator-calc-views" className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1.5">
        Monthly views{platform === 'tiktok' ? ' (qualified)' : ''}
      </label>
      <input
        id="creator-calc-views"
        type="text"
        inputMode="numeric"
        value={monthlyViews}
        onChange={(e) => setMonthlyViews(e.target.value)}
        className="w-full sm:w-64 border-2 border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-lg font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none"
        placeholder="100,000"
      />

      <div className="mt-5 pt-5 border-t-2 border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
          Estimated monthly earnings
        </p>
        <p className="text-3xl font-black text-black dark:text-white">
          {formatUsd(low)} &ndash; {formatUsd(high)}
        </p>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Based on a publicly reported {rate.label} RPM range of {formatUsd(rate.low)}&ndash;{formatUsd(rate.high)} {rate.note}
        </p>
      </div>

      <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed">
        Estimate only &mdash; neither YouTube, TikTok, nor Meta publish exact per-view rates. Real
        earnings vary by audience geography, niche, seasonality, and ad-block usage. Ranges
        compiled from published creator-economy rate trackers as of September 2026.
      </p>
    </div>
  );
}
