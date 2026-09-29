"use client";
// Business analytics (ranking / comparison / deep-dive) from the live
// dashboardApi.analytics.businessPerformance() endpoint (derived from domains+kpis+financials).
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface RankingItem {
  rank: number;
  businessId: string;
  businessName: string;
  country: string;
  flag: string;
  revenue: number;
  growth: number;
  profit: number;
  score: number;
  trend: "up" | "down" | "flat";
}
export interface RevenueMonthRow { month: string; [businessName: string]: string | number }
export interface NamedValue { name: string; growth?: number; margin?: number }
export interface DeepDiveData {
  revenueTrend: { month: string; revenue: number }[];
  expenseBreakdown: { name: string; value: number }[];
  revenueSources: { source: string; revenue: number; percentage: number }[];
  monthlyMetrics: { month: string; revenue: string; profit: string; growth: string }[];
}
export interface BusinessAnalytics {
  ranking: RankingItem[];
  comparison: {
    revenueLast3Months: RevenueMonthRow[];
    growthRates: { name: string; growth: number }[];
    profitMargins: { name: string; margin: number }[];
  };
  deepDive: Record<string, DeepDiveData>;
}

const EMPTY: BusinessAnalytics = {
  ranking: [],
  comparison: { revenueLast3Months: [], growthRates: [], profitMargins: [] },
  deepDive: {},
};

export function useBusinessAnalytics() {
  const [data, setData] = useState<BusinessAnalytics>(EMPTY);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.analytics.businessPerformance();
        const obj = ((d as { data?: unknown })?.data ?? d) as Partial<BusinessAnalytics>;
        if (!cancelled && obj) setData({ ...EMPTY, ...obj, comparison: { ...EMPTY.comparison, ...(obj.comparison ?? {}) } });
      } catch { /* leave empty */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { ...data, loading };
}
