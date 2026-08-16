import React from 'react';
import Link from 'next/link';
import { BarChart3, ArrowRight } from 'lucide-react';

interface CategoryCount {
  name: string;
  slug: string;
  count: number;
}

/**
 * Investopedia's homepage "Original Research" chart slot, filled with real
 * data instead of a fabricated survey -- a horizontal bar readout of how many
 * published guides exist per practice area, computed live from the same pool
 * the rest of the homepage renders from. Single series, so one hue (brand
 * blue) with direct value labels; no legend needed.
 */
export function PracticeAreaChart({ data }: { data: CategoryCount[] }) {
  const rows = [...data]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.count));

  return (
    <div className="rounded-xl border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-4 h-4 text-blue-600" aria-hidden="true" />
        <span className="kicker">Library Snapshot</span>
      </div>
      <h2 className="font-headline text-lg font-extrabold text-slate-900 mb-1">Guides by Practice Area</h2>
      <p className="text-[12.5px] text-slate-500 mb-5 leading-relaxed">
        Published guides currently live on the network, by topic.
      </p>
      <div className="space-y-3.5 flex-1">
        {rows.map((r) => (
          <div key={r.slug}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-[12.5px] font-semibold text-slate-700 truncate">{r.name}</span>
              <span className="text-[12px] font-bold text-slate-900 tabular-nums shrink-0">{r.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2563EB]"
                style={{ width: `${Math.max(6, (r.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <Link
        href="#legal-guides"
        className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-700 hover:text-news-600 transition-colors"
      >
        Explore all practice areas <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
