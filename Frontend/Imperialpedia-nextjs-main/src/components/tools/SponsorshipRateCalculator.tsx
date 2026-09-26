'use client';

import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

type Platform = 'instagram' | 'youtube';
type InstaFormat = 'static' | 'reel' | 'story';

// Published 2026 benchmark ranges — a per-follower formula is deliberately
// avoided (see the article this powers) since production effort and format,
// not raw follower count, drive most of the real variance. Ranges only go as
// high as the data actually supports; Instagram macro+ and TikTok are called
// out as unreliable to benchmark this way rather than extrapolated.
const INSTAGRAM_RATES: Record<InstaFormat, { nano: [number, number]; micro: [number, number] }> = {
  static: { nano: [25, 150], micro: [150, 500] },
  reel: { nano: [50, 300], micro: [300, 800] },
  story: { nano: [15, 75], micro: [40, 150] },
};

const YOUTUBE_TIERS: { min: number; max: number; label: string; range: [number, number] }[] = [
  { min: 1_000, max: 10_000, label: 'Nano', range: [50, 500] },
  { min: 10_000, max: 100_000, label: 'Micro', range: [500, 5_000] },
  { min: 100_000, max: 500_000, label: 'Mid-tier', range: [5_000, 25_000] },
  { min: 500_000, max: 2_000_000, label: 'Macro', range: [25_000, 100_000] },
  { min: 2_000_000, max: Infinity, label: 'Mega', range: [100_000, 500_000] },
];

const formatUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function SponsorshipRateCalculator() {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [followersInput, setFollowersInput] = useState('40000');
  const [format, setFormat] = useState<InstaFormat>('reel');

  const followers = Math.max(0, Number(followersInput.replace(/[^0-9]/g, '')) || 0);

  const result = useMemo(() => {
    if (platform === 'instagram') {
      if (followers < 1_000) return { range: null as [number, number] | null, note: 'Benchmarks start at 1,000 followers.' };
      if (followers > 100_000) return { range: null, note: 'Above 100K followers, rates vary too widely by niche and engagement to benchmark from follower count alone — negotiate directly using engagement rate and past campaign results.' };
      const tier = followers <= 10_000 ? 'nano' : 'micro';
      return { range: INSTAGRAM_RATES[format][tier], note: null };
    }
    const tier = YOUTUBE_TIERS.find((t) => followers >= t.min && followers < t.max);
    if (!tier) return { range: null, note: 'Enter a subscriber count of at least 1,000.' };
    return { range: tier.range, note: `${tier.label} tier (dedicated video)` };
  }, [platform, followers, format]);

  return (
    <div className="not-prose my-8 border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-4 w-4 text-[#c8102e]" />
        <span className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e]">
          Sponsorship Rate Estimator
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['instagram', 'youtube'] as Platform[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
              platform === p
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                : 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-black dark:hover:border-white'
            }`}
          >
            {p === 'instagram' ? 'Instagram' : 'YouTube'}
          </button>
        ))}
      </div>

      {platform === 'instagram' && (
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ['static', 'Static Post'],
            ['reel', 'Reel'],
            ['story', 'Story'],
          ] as [InstaFormat, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormat(key)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
                format === key
                  ? 'bg-[#c8102e] text-white border-[#c8102e]'
                  : 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-[#c8102e]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <label htmlFor="sponsor-calc-followers" className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1.5">
        {platform === 'instagram' ? 'Followers' : 'Subscribers'}
      </label>
      <input
        id="sponsor-calc-followers"
        type="text"
        inputMode="numeric"
        value={followersInput}
        onChange={(e) => setFollowersInput(e.target.value)}
        className="w-full sm:w-64 border-2 border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-lg font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none"
        placeholder="40,000"
      />

      <div className="mt-5 pt-5 border-t-2 border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
          Estimated rate range
        </p>
        {result.range ? (
          <>
            <p className="text-3xl font-black text-black dark:text-white">
              {formatUsd(result.range[0])} &ndash; {formatUsd(result.range[1])}
            </p>
            {result.note && <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{result.note}</p>}
          </>
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300">{result.note}</p>
        )}
      </div>

      <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed">
        A starting anchor, not a fixed price — adjust up for above-average engagement or added usage
        rights/exclusivity, down when new to paid partnerships. Ranges compiled from published 2026
        creator-economy rate benchmarks.
      </p>
    </div>
  );
}
