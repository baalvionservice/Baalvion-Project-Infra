"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuthSDK } from "@baalvion/auth-sdk/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PricingCards } from "@/components/pricing-cards";
import { useAuthedFetch } from "@/lib/auth/use-authed-fetch";
import { useRazorpayCheckout } from "@/lib/billing/use-razorpay-checkout";
import { dailyLimitFromScopes, planLabelFromScopes, type PaidPlanSlug } from "@/lib/plan-quota";
import type { ApiKeyRecord } from "@/lib/types";

const PAID_PLAN_SLUGS: PaidPlanSlug[] = ["starter", "growth", "pro"];

export function BillingView() {
  const authedFetch = useAuthedFetch();
  const { email } = useAuthSDK();
  const [keys, setKeys] = useState<ApiKeyRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justUpgraded, setJustUpgraded] = useState(false);
  const autoCheckoutFired = useRef(false);

  const loadKeys = useCallback(async () => {
    try {
      const data = await authedFetch<{ items: ApiKeyRecord[] }>("/api/keys");
      setKeys(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your plan.");
    }
  }, [authedFetch]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const { checkout, isProcessing } = useRazorpayCheckout({
    onSuccess: () => {
      setJustUpgraded(true);
      // Fulfillment happens via the Razorpay webhook, not this tab — give it a few seconds
      // then refetch so the "Current plan" card reflects the upgrade without a manual reload.
      setTimeout(loadKeys, 4000);
    },
  });

  // Two entry points land here needing a plan applied automatically: post-signup redirect from
  // /signup?plan=X (see signup/page.tsx), and PricingCards' onSuccess redirect (?upgraded=1).
  useEffect(() => {
    if (autoCheckoutFired.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("upgraded")) setJustUpgraded(true);
    const plan = PAID_PLAN_SLUGS.find((slug) => slug === params.get("plan"));
    if (plan) {
      autoCheckoutFired.current = true;
      checkout(plan);
    }
  }, [checkout]);

  const activeKey = keys?.find((k) => k.status === "active") ?? null;
  const plan = planLabelFromScopes(activeKey?.scopes);
  const dailyLimit = dailyLimitFromScopes(activeKey?.scopes);

  return (
    <div className="space-y-6">
      {justUpgraded && (
        <p className="flex items-center gap-2 rounded-md border border-signal-positive/30 bg-signal-positive/10 px-4 py-3 text-sm text-signal-positive">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Payment received — your new quota unlocks within a minute of Razorpay confirming the charge.
        </p>
      )}

      <Card className="glow-card">
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Current plan</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {keys === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : error ? (
            <p className="text-sm text-signal-negative">{error}</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{plan}</span>
                <Badge variant={activeKey ? "positive" : "neutral"}>{activeKey ? "Active" : "No active key"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {dailyLimit.toLocaleString()} requests/day on{" "}
                {email ? <span className="text-foreground">{email}</span> : "your account"}. Plan changes below take
                effect automatically once Razorpay confirms payment.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          Change plan
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
        </h2>
        <PricingCards compact />
        <p className="mt-4 text-xs text-muted-foreground">
          Checkout is a one-time charge that unlocks the plan&apos;s quota — it doesn&apos;t auto-renew yet, so
          there&apos;s nothing to cancel and no surprise charge next month. Receipts are emailed by Razorpay
          automatically after checkout.
        </p>
      </div>
    </div>
  );
}
