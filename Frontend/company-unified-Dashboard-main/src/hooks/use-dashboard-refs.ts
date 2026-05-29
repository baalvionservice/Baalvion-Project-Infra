"use client";
// Shared loader for the common "reference" lists (businesses, employees) many dashboard
// components need for dropdowns/lookups. Used by ~23 components, so it goes through a shared
// cache (cachedGet) — one fetch is reused across every component + navigation instead of
// each mount firing its own /domains + /employees calls.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";
import { cachedGet, invalidateCache } from "./use-cached";

export interface Ref { id: string; name: string }
export interface EmployeeRef extends Ref { email: string; imageId: string; department: string; role: string; status: string }

const arr = (r: unknown): Record<string, unknown>[] =>
  ((r as { data?: unknown[] })?.data ?? (Array.isArray(r) ? r : [])) as Record<string, unknown>[];

const CACHE_KEY = "dashboard-refs";

async function loadRefs(): Promise<{ businesses: Ref[]; employees: EmployeeRef[] }> {
  const [bz, em] = await Promise.all([dashboardApi.businesses(), dashboardApi.employees()]);
  return {
    businesses: arr(bz).map((b) => ({ id: String(b.id), name: String(b.name ?? "") })),
    employees: arr(em).map((e) => ({
      id: String(e.id), name: String(e.name ?? ""), email: String(e.email ?? ""), imageId: `user-${e.id}`,
      department: String(e.department ?? ""), role: String(e.role ?? ""), status: String(e.status ?? ""),
    })),
  };
}

export function useDashboardRefs() {
  const [businesses, setBusinesses] = useState<Ref[]>([]);
  const [employees, setEmployees] = useState<EmployeeRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const apply = (r: { businesses: Ref[]; employees: EmployeeRef[] }) => {
      if (cancelled) return;
      setBusinesses(r.businesses); setEmployees(r.employees); setLoading(false);
    };
    cachedGet(CACHE_KEY, loadRefs).then(apply).catch(() => { if (!cancelled) setLoading(false); });
    // Any business/employee mutation → drop the cache and refetch (shared across all 23 consumers).
    const bust = () => { invalidateCache(CACHE_KEY); cachedGet(CACHE_KEY, loadRefs).then(apply).catch(() => {}); };
    window.addEventListener("business-created", bust);
    window.addEventListener("refs-changed", bust);
    return () => {
      cancelled = true;
      window.removeEventListener("business-created", bust);
      window.removeEventListener("refs-changed", bust);
    };
  }, []);

  return { businesses, employees, loading };
}
