"use client";
// Automation view (scheduled cron jobs + recent webhook deliveries) from the live
// dashboardApi.automation() reference endpoint.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface CronJob { id: string; name: string; description: string; frequency: string; lastRun: string; nextRun: string; duration: string; status: string }
export interface WebhookEvent { id: string; timestamp: string; eventType: string; source: string; payload: string; responseCode: number; status: string }

export function useAutomation() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.automation();
        const obj = ((d as { data?: unknown })?.data ?? d) as { cronJobs?: CronJob[]; webhooks?: WebhookEvent[] };
        if (cancelled) return;
        setCronJobs(obj?.cronJobs ?? []);
        setWebhooks(obj?.webhooks ?? []);
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return { cronJobs, webhooks };
}
