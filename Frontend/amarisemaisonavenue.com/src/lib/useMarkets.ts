'use client';
/**
 * Client hook over the markets registry (./markets). Fetches the public /commerce/markets
 * feed ONCE per session (module-level promise cache) and exposes the authoritative per-market
 * currency/tax/FX. Falls back to an empty registry (markets:[]) when the feed is unreachable,
 * so consumers can transparently use the static FE tables.
 */
import { useEffect, useState } from 'react';
import { getMarkets, getMarket, type MarketsRegistry, type Market } from './markets';
import type { CountryCode } from './types';

const EMPTY: MarketsRegistry = { baseCurrency: 'USD', defaultMarket: 'us', markets: [] };

// One in-flight fetch shared across all hook callers in the session.
let cached: MarketsRegistry | null = null;
let inflight: Promise<MarketsRegistry> | null = null;

function loadMarkets(): Promise<MarketsRegistry> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = getMarkets().then((registry) => {
      // Only cache a non-empty registry so a transient failure can be retried later.
      if (registry.markets.length > 0) cached = registry;
      inflight = null;
      return registry;
    });
  }
  return inflight;
}

export function useMarkets(): { registry: MarketsRegistry; loading: boolean } {
  const [registry, setRegistry] = useState<MarketsRegistry>(cached ?? EMPTY);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    let active = true;
    if (cached) {
      setRegistry(cached);
      setLoading(false);
      return;
    }
    loadMarkets().then((r) => {
      if (!active) return;
      setRegistry(r);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { registry, loading };
}

/** Resolve one market (or undefined) from the live registry. */
export function useMarket(country: CountryCode): { market: Market | undefined; loading: boolean } {
  const { registry, loading } = useMarkets();
  return { market: getMarket(registry, country), loading };
}
