"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiCard from "./components/kpi-card";
import KpiTable from "./components/kpi-table";
import KpiAlerts from "./components/kpi-alerts";
import { dashboardApi } from "@/lib/api-client";
import type { KpiPeriod, AllKpis, KpiData } from "@/lib/types";

const periods: KpiPeriod[] = ["Day", "Week", "Month", "Quarter", "Year"];

// Map a live dashboard-service kpi row to the page's KpiData shape.
function toKpi(r: Record<string, unknown>): KpiData {
  const trend = String(r.profit_trend ?? "flat");
  return {
    businessId: String(r.business_id ?? r.id ?? ""),
    revenue: { target: Number(r.revenue_target ?? 0), actual: Number(r.revenue_actual ?? 0) },
    profitMargin: { value: Number(r.profit_margin ?? 0), trend: (["up", "down", "flat"].includes(trend) ? trend : "flat") as "up" | "down" | "flat" },
    customers: { total: Number(r.customers_total ?? 0), change: Number(r.customers_change ?? 0) },
    returnRate: Number(r.return_rate ?? 0),
    nps: Number(r.nps ?? 0),
  };
}

export default function KpiTrackerPage() {
  const [period, setPeriod] = useState<KpiPeriod>("Month");
  const [allKpis, setAllKpis] = useState<AllKpis>(
    Object.fromEntries(periods.map((p) => [p, []])) as AllKpis,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.kpis();
        const arr = ((d as { data?: unknown[] })?.data ?? (Array.isArray(d) ? d : [])) as Record<string, unknown>[];
        const mapped = arr.map(toKpi);
        // The backend isn't period-segmented yet, so each period shows the same live KPIs.
        if (!cancelled) setAllKpis(Object.fromEntries(periods.map((p) => [p, mapped])) as AllKpis);
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePeriodChange = (value: string) => {
    setPeriod(value as KpiPeriod);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KPI Tracker</h1>
        <p className="text-muted-foreground">
          Monitor Key Performance Indicators across all business units.
        </p>
      </div>

      <Tabs value={period} onValueChange={handlePeriodChange}>
        <TabsList>
          {periods.map((p) => (
            <TabsTrigger key={p} value={p}>
              {p}
            </TabsTrigger>
          ))}
        </TabsList>
        {periods.map((p) => (
          <TabsContent key={p} value={p} className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {allKpis[p].map((kpi) => (
                <KpiCard key={kpi.businessId} kpi={kpi} />
              ))}
            </div>
            <div className="mt-8">
              <KpiTable kpiData={allKpis[p]} />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-8">
        <KpiAlerts />
      </div>
    </div>
  );
}
