import React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { getAssetQuote } from '@/lib/data/loaders';

interface LiveQuoteCardProps {
  ticker: string;
}

const fmtMarketCap = (v: number | null) => {
  if (v == null) return null;
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  return `$${v.toLocaleString()}`;
};

// Server Component — fetches its own data so it can be dropped into any entity
// sidebar without the parent page needing to know about live quotes.
export const LiveQuoteCard = async ({ ticker }: LiveQuoteCardProps) => {
  const asset = await getAssetQuote(ticker);
  if (!asset || asset.current_price == null) return null;

  // The API serializes Postgres NUMERIC columns as strings despite the
  // `number | null` type — same coercion MarketHighlights/MarketRow already
  // apply for this exact field.
  const price = Number(asset.current_price);
  const pct = asset.change_pct_24h != null ? Number(asset.change_pct_24h) : null;
  const up = (pct ?? 0) >= 0;
  const marketCap = fmtMarketCap(asset.market_cap);

  return (
    <Card className="glass-card border-none bg-card/30 shadow-inner">
      <CardContent className="p-5 space-y-3">
        <Text variant="label" className="text-[10px] opacity-50 font-bold uppercase tracking-widest">
          {asset.symbol} · Live
        </Text>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">
            ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          {pct != null && (
            <span className={`flex items-center gap-0.5 text-sm font-semibold ${up ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {up ? '+' : ''}{pct.toFixed(2)}%
            </span>
          )}
        </div>
        {marketCap && (
          <Text variant="label" className="text-xs opacity-60">
            Market Cap: {marketCap}
          </Text>
        )}
        {asset.ai_summary && (
          <p className="text-xs opacity-70 leading-relaxed pt-1 border-t border-border/50">
            {asset.ai_summary}
          </p>
        )}
        <Link
          href={`/markets/quote/${asset.symbol}`}
          className="block text-xs font-semibold text-primary hover:underline pt-1"
        >
          Full quote &amp; chart &rarr;
        </Link>
      </CardContent>
    </Card>
  );
};
