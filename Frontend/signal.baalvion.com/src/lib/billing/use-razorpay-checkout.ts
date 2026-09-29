"use client";

import { useCallback, useState } from "react";

import { useAuthedFetch } from "@/lib/auth/use-authed-fetch";
import type { PaidPlanSlug } from "@/lib/plan-quota";
import { loadRazorpayScript } from "./load-razorpay-script";
import type { RazorpayCheckoutOptions } from "./razorpay-checkout";

interface CheckoutOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  planSlug: PaidPlanSlug;
  discounted: boolean;
  prefillEmail: string;
}

interface UseRazorpayCheckoutOptions {
  /** Fired once the Razorpay modal reports success. Actual plan upgrade happens via webhook. */
  onSuccess?: () => void;
}

export function useRazorpayCheckout({ onSuccess }: UseRazorpayCheckoutOptions = {}) {
  const authedFetch = useAuthedFetch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(
    async (plan: PaidPlanSlug) => {
      setError(null);
      setIsProcessing(true);
      try {
        const order = await authedFetch<CheckoutOrder>(`/api/billing/checkout/${plan}`, { method: "POST" });
        await loadRazorpayScript();
        if (!window.Razorpay) throw new Error("Razorpay Checkout failed to load");

        const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
        const options: RazorpayCheckoutOptions = {
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "Baalvion Intelligence",
          description: `${planLabel} plan${order.discounted ? " — founding customer, 50% off" : ""}`,
          prefill: order.prefillEmail ? { email: order.prefillEmail } : undefined,
          theme: { color: "#6366f1" },
          handler: () => {
            setIsProcessing(false);
            onSuccess?.();
          },
          modal: { ondismiss: () => setIsProcessing(false) },
        };
        new window.Razorpay(options).open();
      } catch (err) {
        setIsProcessing(false);
        setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      }
    },
    [authedFetch, onSuccess]
  );

  return { checkout, isProcessing, error };
}
