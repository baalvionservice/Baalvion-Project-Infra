"use client";
// FX rates from the live /fx-rates endpoint. Returns the detailed rate list (for the rates table)
// plus a code->rate map and a USD-converter helper (for the converter / consolidated views).
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface FxRateRow { code: string; symbol: string; currency: string; rate: number; change24h: number; change7d: number; lastUpdated: string }

export function useFxRates() {
  const [rates, setRates] = useState<FxRateRow[]>([]);
  const [map, setMap] = useState<Record<string, number>>({ USD: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.fxRates();
        const obj = ((d as { data?: unknown })?.data ?? d) as { rates?: FxRateRow[] };
        const list = obj?.rates ?? [];
        if (cancelled) return;
        setRates(list);
        setMap(Object.fromEntries(list.map((r) => [r.code, Number(r.rate) || 1])));
      } catch { /* leave defaults */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { rates, map, loading };
}
