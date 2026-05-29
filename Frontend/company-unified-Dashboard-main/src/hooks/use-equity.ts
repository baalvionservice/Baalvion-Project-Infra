"use client";
// Builds the equity view from the live cap table (dashboardApi.equity = shareholders) + real KPI
// revenue. The backend models a flat org cap table (name, role, equity_percentage); the UI expects
// per-business EquityData with valuation/usdValue/vesting/history. We present ONE org-level group:
//   - equity %        : real (shareholders.equity_percentage)
//   - valuation       : derived from real KPI revenue_actual (transparent proxy; backend has no
//                        dedicated valuation field yet)
//   - usdValue        : equity% × valuation
//   - vestingStatus   : "Vested" (no vesting schedule stored yet)
//   - equityHistory   : current grants surfaced as grant events (no event log stored yet)
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";
import type { EquityData } from "@/lib/types";

const arr = (r: unknown): Record<string, unknown>[] =>
  ((r as { data?: unknown[] })?.data ?? (Array.isArray(r) ? r : [])) as Record<string, unknown>[];

export function useEquity() {
  const [equity, setEquity] = useState<EquityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [shRes, kpiRes] = await Promise.all([dashboardApi.equity(), dashboardApi.kpis()]);
        const holders = arr(shRes);
        const kpis = arr(kpiRes);
        const valuation = kpis.reduce((s, k) => s + Number(k.revenue_actual ?? 0), 0) || 0;
        const stakeholders = holders.map((h) => {
          const equityPct = Number(h.equity_percentage ?? 0);
          return {
            name: String(h.name ?? ""),
            role: String(h.role ?? ""),
            equity: equityPct,
            usdValue: Math.round((equityPct / 100) * valuation),
            vestingStatus: "Vested",
          };
        });
        const equityHistory = holders.map((h, i) => ({
          id: `grant-${h.id ?? i}`,
          date: String(h.created_at ?? h.createdAt ?? new Date().toISOString()),
          event: "Initial Grant",
          stakeholder: String(h.name ?? ""),
          change: `+${Number(h.equity_percentage ?? 0).toFixed(2)}%`,
          newTotal: `${Number(h.equity_percentage ?? 0).toFixed(2)}%`,
        }));
        const data: EquityData[] = stakeholders.length
          ? [{ businessId: "company-wide", valuation, stakeholders, equityHistory } as unknown as EquityData]
          : [];
        if (!cancelled) setEquity(data);
      } catch { /* leave empty */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { equity, loading };
}
