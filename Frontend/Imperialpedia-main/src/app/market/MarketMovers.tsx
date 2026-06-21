'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Text } from '@/design-system/typography/text';
import { Activity } from 'lucide-react';

interface Asset {
  symbol: string;
  name: string;
  asset_type: string;
  current_price: string | number;
  change_pct_24h: string | number;
  sentiment: string;
}

const IMP_API = process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3004/api/v1');

/**
 * Live "Market Movers" strip — reads imperialpedia-service `/assets` (asset_summaries).
 * Client-fetched; renders nothing if the service is unreachable/empty (graceful).
 */
export function MarketMovers() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${IMP_API}/assets?limit=24`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => setAssets(j?.data?.items ?? []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || assets.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="h-4 w-4 text-primary" />
        <Text variant="label" className="font-bold tracking-widest uppercase">
          Market Movers
        </Text>
        <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {assets.map((a) => {
          const chg = Number(a.change_pct_24h);
          const up = chg >= 0;
          const price = Number(a.current_price);
          return (
            <Link
              key={a.symbol}
              href={`/ai-analyst/asset-summary?symbol=${a.symbol}`}
              className="rounded-2xl border border-white/5 bg-background/50 p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{a.symbol}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{a.asset_type}</span>
              </div>
              <div className="mt-2 text-sm font-semibold">
                ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`text-xs font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
                {up ? '▲' : '▼'} {up ? '+' : ''}{chg.toFixed(2)}%
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
