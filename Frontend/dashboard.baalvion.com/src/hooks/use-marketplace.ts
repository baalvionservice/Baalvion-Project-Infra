"use client";
// Marketplace catalog + installed apps from the live dashboardApi.marketplace() reference endpoint.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface MarketApp {
  slug: string; name: string; category: string; description: string; rating: number; installs: number;
  developer: string; version: string; lastUpdated: string; featured: boolean; icon: string;
  permissions: string[]; pricing: string; features: string[]; screenshots: string[];
  reviews: { user: string; rating: number; comment: string }[];
}

export function useMarketplace() {
  const [apps, setApps] = useState<MarketApp[]>([]);
  const [installed, setInstalled] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.marketplace();
        const obj = ((d as { data?: unknown })?.data ?? d) as { apps?: MarketApp[]; installed?: string[] };
        if (cancelled) return;
        setApps(obj?.apps ?? []);
        setInstalled(obj?.installed ?? []);
      } catch { /* leave empty */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { apps, installed, loading };
}
