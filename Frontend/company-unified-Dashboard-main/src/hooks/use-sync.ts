"use client";
// Sync view (online/offline sales snapshots + data conflicts) from the live dashboardApi.sync() endpoint.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

interface SalesSnapshot {
  todaysRevenue: number; ordersToday: number; avgOrderValue: number; walkInCustomers: number; avgTransaction: number;
  topChannels: { website: number; app: number }; topStore: { name: string; business: string };
  revenueLast7Days: { day: string; revenue: number }[];
}
export interface Conflict { id: string; businessId: string; field: string; offlineValue: string; onlineValue: string; detectedAt: string }
export interface ResolvedConflict { id: string; field: string; businessId: string; resolvedBy: string; resolvedAt: string; action: string }
export interface SyncData { online: SalesSnapshot; offline: SalesSnapshot; conflicts: Conflict[]; resolvedConflicts: ResolvedConflict[] }

const EMPTY_SNAP: SalesSnapshot = { todaysRevenue: 0, ordersToday: 0, avgOrderValue: 0, walkInCustomers: 0, avgTransaction: 0, topChannels: { website: 0, app: 0 }, topStore: { name: "", business: "" }, revenueLast7Days: [] };
const EMPTY: SyncData = {
  online: { ...EMPTY_SNAP },
  offline: { ...EMPTY_SNAP },
  conflicts: [], resolvedConflicts: [],
};

export function useSync() {
  const [data, setData] = useState<SyncData>(EMPTY);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.sync();
        const obj = ((d as { data?: unknown })?.data ?? d) as Partial<SyncData>;
        if (!cancelled && obj) setData({
          online: { ...EMPTY_SNAP, ...(obj.online ?? {}) },
          offline: { ...EMPTY_SNAP, ...(obj.offline ?? {}) },
          conflicts: obj.conflicts ?? [],
          resolvedConflicts: obj.resolvedConflicts ?? [],
        });
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return data;
}
