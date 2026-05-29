"use client";
// Billing view (subscription, usage, contact, invoices) from the live dashboardApi.billing() endpoint.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface BillingData {
  subscription: { plan: string; price: number; annualPrice: number; billingCycle: string; status: string; nextBillingDate: string; paymentMethod: { type: string; last4: string; expiry: string } };
  usage: { businesses: { used: number; limit: number }; users: { used: number; limit: number }; apiCalls: { used: number; limit: number }; storage: { used: number; limit: number } };
  billingContact: { name: string; email: string; company: string; address: string };
  invoices: { id: string; period: string; amount: number; status: string; paymentDate: string }[];
}

const ZERO = { used: 0, limit: 0 };
const EMPTY: BillingData = {
  subscription: { plan: "", price: 0, annualPrice: 0, billingCycle: "", status: "", nextBillingDate: "", paymentMethod: { type: "", last4: "", expiry: "" } },
  usage: { businesses: ZERO, users: ZERO, apiCalls: ZERO, storage: ZERO }, billingContact: { name: "", email: "", company: "", address: "" }, invoices: [],
};

export function useBilling() {
  const [data, setData] = useState<BillingData>(EMPTY);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.billing();
        const obj = ((d as { data?: unknown })?.data ?? d) as BillingData;
        if (!cancelled && obj) setData({ ...EMPTY, ...obj });
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return data;
}
