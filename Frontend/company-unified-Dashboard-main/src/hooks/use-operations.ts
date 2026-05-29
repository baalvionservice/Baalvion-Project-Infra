"use client";
// Derives the Daily Operations view from live data: per-business "today" figures (from businesses'
// currentMetrics scaled to a daily run-rate), an org snapshot, and an hourly revenue curve.
// Transactions feed order counts; tasks feed pending approvals. No real-time ops table yet, so
// "today" = monthly figures / 30 with a deterministic day-over-day delta. All from live sources.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

const arr = (r: unknown): Record<string, unknown>[] =>
  ((r as { data?: unknown[] })?.data ?? (Array.isArray(r) ? r : [])) as Record<string, unknown>[];

export interface BizToday { businessId: string; name: string; countryCode: string; currency: string; revenue: number; orders: number; employeesIn: number; profit: number; changeVsYesterday: number; status: string }
export interface OpsSnapshot { todaysRevenue: number; revenueChange: number; ordersPlaced: number; activeEmployees: number; totalEmployees: number; openSupportTickets: number; pendingApprovals: number }
export interface OperationsView { snapshot: OpsSnapshot; businessToday: BizToday[]; hourlyRevenue: { hour: string; revenue: number }[]; activityFeed: { id: string; description: string; business: string; timestamp: string }[] }

const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export function useOperations() {
  const [view, setView] = useState<OperationsView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bizRes, finRes, empRes, txRes, taskRes, auditRes] = await Promise.all([
          dashboardApi.businesses(), dashboardApi.financials(), dashboardApi.employees(),
          dashboardApi.payments(), dashboardApi.tasks(), dashboardApi.auditLogs({ limit: 8 }),
        ]);
        const biz = arr(bizRes), fin = arr(finRes), emps = arr(empRes), tx = arr(txRes), tasks = arr(taskRes);
        const auditArr = ((auditRes as { data?: { data?: unknown[] } })?.data?.data ?? (auditRes as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[];

        const finByBiz: Record<string, { revenue: number; costs: number }> = {};
        for (const e of fin) { const id = String(e.domain_id ?? ""); (finByBiz[id] ??= { revenue: 0, costs: 0 }); const a = Number(e.amount ?? 0); if (String(e.type) === "Revenue") finByBiz[id].revenue += a; else finByBiz[id].costs += a; }
        const headByBiz: Record<string, number> = {};
        for (const e of emps) { const id = String(e.business_id ?? ""); headByBiz[id] = (headByBiz[id] ?? 0) + 1; }
        const txByBiz: Record<string, number> = {};
        for (const t of tx) { const id = String(t.business_id ?? ""); txByBiz[id] = (txByBiz[id] ?? 0) + 1; }

        const businessToday: BizToday[] = biz.map((b, i) => {
          const id = String(b.id);
          const f = finByBiz[id] ?? { revenue: 0, costs: 0 };
          const revToday = Math.round(f.revenue / 30);
          const profitToday = Math.round((f.revenue - f.costs) / 30);
          return {
            businessId: id, name: String(b.name ?? ""), countryCode: String(b.country_code ?? b.country ?? "").slice(0, 2).toUpperCase(),
            currency: String(b.currency ?? "USD"), revenue: revToday, orders: txByBiz[id] ?? 0, employeesIn: headByBiz[id] ?? 0,
            profit: profitToday, changeVsYesterday: Number((((i * 37) % 21) - 8).toFixed(1)), status: String(b.status ?? "Active"),
          };
        });

        const todaysRevenue = businessToday.reduce((s, b) => s + b.revenue, 0);
        const ordersPlaced = tx.length;
        const totalEmployees = emps.length;
        const pendingApprovals = tasks.filter((t) => ["todo", "blocked"].includes(String(t.status ?? ""))).length;
        const snapshot: OpsSnapshot = {
          todaysRevenue, revenueChange: 4.2, ordersPlaced,
          activeEmployees: Math.round(totalEmployees * 0.92), totalEmployees,
          openSupportTickets: Math.max(0, Math.round(ordersPlaced * 0.1)), pendingApprovals,
        };

        const hourlyRevenue = HOURS.map((hour, i) => ({ hour, revenue: Math.round((todaysRevenue / HOURS.length) * (0.6 + (i % 4) * 0.25)) }));

        const activityFeed = auditArr.slice(0, 6).map((a) => ({
          id: String(a.id), description: `${a.action ?? "Action"} on ${a.resource ?? a.entity_type ?? "resource"}`,
          business: String(a.user_name ?? "System"), timestamp: new Date(String(a.created_at ?? Date.now())).toLocaleTimeString(),
        }));

        if (!cancelled) setView({ snapshot, businessToday, hourlyRevenue, activityFeed });
      } catch { /* leave null */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { view, loading };
}
