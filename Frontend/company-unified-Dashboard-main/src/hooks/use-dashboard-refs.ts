"use client";
// Shared loader for the common "reference" lists (businesses, employees) many dashboard
// components need for dropdowns/lookups. Fetches once per mount via dashboardApi (gateway ->
// dashboard-service). Returns normalized { id, name } refs plus the raw employee rows.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface Ref { id: string; name: string }
export interface EmployeeRef extends Ref { imageId: string; department: string; role: string; status: string }

const arr = (r: unknown): Record<string, unknown>[] =>
  ((r as { data?: unknown[] })?.data ?? (Array.isArray(r) ? r : [])) as Record<string, unknown>[];

export function useDashboardRefs() {
  const [businesses, setBusinesses] = useState<Ref[]>([]);
  const [employees, setEmployees] = useState<EmployeeRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bz, em] = await Promise.all([dashboardApi.businesses(), dashboardApi.employees()]);
        if (cancelled) return;
        setBusinesses(arr(bz).map((b) => ({ id: String(b.id), name: String(b.name ?? "") })));
        setEmployees(arr(em).map((e) => ({
          id: String(e.id), name: String(e.name ?? ""), imageId: `user-${e.id}`,
          department: String(e.department ?? ""), role: String(e.role ?? ""), status: String(e.status ?? ""),
        })));
      } catch { /* leave empty */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { businesses, employees, loading };
}
