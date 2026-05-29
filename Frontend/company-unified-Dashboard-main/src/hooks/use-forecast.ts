"use client";
// Revenue forecast + AI recommendations from the live dashboardApi.analytics.forecast() endpoint
// (projection anchored to real company revenue; recommendations are reference strategic insights).
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface ForecastPoint { month: string; revenue: number }
export interface ForecastBand { month: string; base: number; low: number; high: number }
export interface ForecastScenarios { conservative: number; baseCase: number; optimistic: number }
export interface AiRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
}
export interface ForecastData {
  revenueForecast: { historical: ForecastPoint[]; forecast: ForecastBand[]; scenarios: ForecastScenarios };
  aiRecommendations: AiRecommendation[];
}

const EMPTY: ForecastData = {
  revenueForecast: { historical: [], forecast: [], scenarios: { conservative: 0, baseCase: 0, optimistic: 0 } },
  aiRecommendations: [],
};

export function useForecast() {
  const [data, setData] = useState<ForecastData>(EMPTY);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.analytics.forecast();
        const obj = ((d as { data?: unknown })?.data ?? d) as Partial<ForecastData>;
        if (!cancelled && obj) {
          setData({
            revenueForecast: { ...EMPTY.revenueForecast, ...(obj.revenueForecast ?? {}) },
            aiRecommendations: obj.aiRecommendations ?? [],
          });
        }
      } catch { /* leave empty */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { ...data, loading };
}
