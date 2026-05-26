"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiCard from "./components/kpi-card";
import KpiTable from "./components/kpi-table";
import KpiAlerts from "./components/kpi-alerts";
import kpiData from "@/lib/data/kpis.json";
import type { KpiPeriod, AllKpis, KpiData } from "@/lib/types";
import { Target } from "lucide-react";

const allKpis: AllKpis = Object.fromEntries(
  Object.entries(kpiData).map(([period, data]) => [
    period,
    (data as any[]).map((item: any) => ({
      ...item,
      profitMargin: {
        ...item.profitMargin,
        trend: item.profitMargin.trend as "up" | "down" | "flat",
      },
    })),
  ])
) as AllKpis;
const periods: KpiPeriod[] = ["Day", "Week", "Month", "Quarter", "Year"];

export default function KpiTrackerPage() {
  const [period, setPeriod] = useState<KpiPeriod>("Month");

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
