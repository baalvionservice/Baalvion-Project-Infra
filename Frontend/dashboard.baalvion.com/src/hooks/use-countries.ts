"use client";
// Countries reference list from the live dashboardApi.countries() endpoint.
// The backend returns { name, code, currency, businesses }; the flag emoji is derived from `code`.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface Country { code: string; name: string; flag: string; currency: string }

function flagFromCode(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.countries();
        const list = (((d as { data?: unknown[] })?.data ?? (Array.isArray(d) ? d : [])) as Record<string, unknown>[]);
        if (!cancelled) {
          setCountries(list.map((c) => ({
            code: String(c.code ?? ""),
            name: String(c.name ?? ""),
            flag: flagFromCode(String(c.code ?? "")),
            currency: String(c.currency ?? ""),
          })));
        }
      } catch { /* leave empty */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { countries, loading };
}
