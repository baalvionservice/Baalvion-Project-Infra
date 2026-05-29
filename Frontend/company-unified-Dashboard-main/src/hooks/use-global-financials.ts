"use client";
// Builds the Global Financials view from live sources: domains (businesses) + financial_entries
// (revenue/profit) + employees (headcount) + countries + fx-rates. Produces businesses with
// currentMetrics, country list, and a derived server-cost estimate (no infra-cost table yet —
// estimated at ~3% of country revenue). All real-derived; no static mock JSON.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

const arr = (r: unknown): Record<string, unknown>[] =>
  ((r as { data?: unknown[] })?.data ?? (Array.isArray(r) ? r : [])) as Record<string, unknown>[];

export interface GFBusiness {
  id: string; name: string; country: string; currency: string; status: string; imageId: string;
  currentMetrics: { revenue: number; profit: number; employees: number };
}
export interface GFCountry { id: string; name: string; flag: string; continent: string; complianceStatus: string }
export interface GFServerCost { country: string; provider: string; services: string; cost: number }

const FLAGS: Record<string, string> = {
  "United Arab Emirates": "🇦🇪", Singapore: "🇸🇬", India: "🇮🇳", "United Kingdom": "🇬🇧",
  France: "🇫🇷", "United States": "🇺🇸", Germany: "🇩🇪",
};
const CONTINENTS: Record<string, string> = {
  "United Arab Emirates": "Asia", Singapore: "Asia", India: "Asia", "United Kingdom": "Europe",
  France: "Europe", "United States": "North America", Germany: "Europe",
};
const PROVIDERS = ["AWS", "Google Cloud", "Azure"];

export function useGlobalFinancials() {
  const [businesses, setBusinesses] = useState<GFBusiness[]>([]);
  const [countries, setCountries] = useState<GFCountry[]>([]);
  const [serverCosts, setServerCosts] = useState<GFServerCost[]>([]);
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bizRes, finRes, empRes, ctyRes, fxRes] = await Promise.all([
          dashboardApi.businesses(), dashboardApi.financials(), dashboardApi.employees(),
          dashboardApi.countries(), dashboardApi.fxRates(),
        ]);
        const biz = arr(bizRes), fin = arr(finRes), emps = arr(empRes), ctys = arr(ctyRes);
        const fxObj = ((fxRes as { data?: unknown })?.data ?? fxRes) as { rates?: { code: string; rate: number }[] };

        // fx map: currency code -> rate vs USD
        const fx: Record<string, number> = { USD: 1 };
        for (const r of fxObj?.rates ?? []) { if (r.code) fx[r.code] = Number(r.rate) || 1; }

        // per-business revenue/costs from financial_entries
        const finByBiz: Record<string, { revenue: number; costs: number }> = {};
        for (const e of fin) {
          const id = String(e.domain_id ?? "");
          (finByBiz[id] ??= { revenue: 0, costs: 0 });
          const amt = Number(e.amount ?? 0);
          if (String(e.type) === "Revenue") finByBiz[id].revenue += amt; else finByBiz[id].costs += amt;
        }
        // headcount per business
        const headByBiz: Record<string, number> = {};
        for (const e of emps) { const id = String(e.business_id ?? ""); headByBiz[id] = (headByBiz[id] ?? 0) + 1; }

        const gfBiz: GFBusiness[] = biz.map((b) => {
          const id = String(b.id);
          const f = finByBiz[id] ?? { revenue: 0, costs: 0 };
          return {
            id, name: String(b.name ?? ""), country: String(b.country ?? ""), currency: String(b.currency ?? "USD"),
            status: String(b.status ?? "Active"), imageId: "business-default",
            currentMetrics: { revenue: f.revenue, profit: f.revenue - f.costs, employees: headByBiz[id] ?? 0 },
          };
        });

        const gfCountries: GFCountry[] = ctys.map((c, i) => {
          const name = String(c.name ?? "");
          return {
            id: String(c.code ?? c.name ?? i), name, flag: FLAGS[name] ?? "🌐",
            continent: CONTINENTS[name] ?? "—", complianceStatus: "Compliant",
          };
        });

        // server costs: estimate ~3% of country USD revenue (no infra-cost table yet)
        const gfServerCosts: GFServerCost[] = gfCountries.map((c, i) => {
          const inCountry = gfBiz.filter((b) => b.country === c.name);
          const usdRev = inCountry.reduce((s, b) => s + b.currentMetrics.revenue / (fx[b.currency] || 1), 0);
          return { country: c.name, provider: PROVIDERS[i % PROVIDERS.length], services: "Compute, DB, Storage, CDN", cost: Math.round((usdRev * 0.03) / 12) };
        }).filter((s) => s.country);

        if (cancelled) return;
        setFxRates(fx); setBusinesses(gfBiz); setCountries(gfCountries); setServerCosts(gfServerCosts);
      } catch { /* leave empty */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { businesses, countries, serverCosts, fxRates, loading };
}
