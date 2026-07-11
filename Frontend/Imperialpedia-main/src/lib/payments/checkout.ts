// Browser-side Razorpay checkout for Imperialpedia Premium.
//
// Calls the server-authoritative POST /payments/checkout (the charge amount is computed from the
// plan on the backend — NEVER trusted from here), then opens the Razorpay Checkout modal with the
// PUBLIC key + order id the backend returned. No secret key ever touches the client. Activation is
// authoritative server-side via the signature-verified webhook, so a closed tab or refresh still
// results in an active subscription once Razorpay confirms payment.
import { apiClient } from "@/services/api-client/client";

export type BillingCycle = "monthly" | "annual";

type CheckoutResponse = {
  success: boolean;
  data?: {
    provider: "razorpay" | "free";
    subscriptionId: string;
    paymentId?: string;
    amount?: number;
    currency?: string;
    clientParams?: {
      provider: string;
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      name: string;
    };
  };
  error?: string;
};

const RAZORPAY_SDK = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpaySdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Razorpay requires a browser"));
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SDK}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }
    const s = document.createElement("script");
    s.src = RAZORPAY_SDK;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}

export type StartCheckoutResult =
  | { status: "activated"; subscriptionId: string }
  | { status: "modal_open" };

/** Start checkout for a tier. Throws on a misconfigured/missing provider so the caller can show
 * an error instead of a silent no-charge. */
export async function startPremiumCheckout(args: {
  tierKey: string;
  billingCycle: BillingCycle;
  onSuccess?: () => void;
}): Promise<StartCheckoutResult> {
  const res = await apiClient.post<CheckoutResponse>("/payments/checkout", {
    tierKey: args.tierKey,
    billingCycle: args.billingCycle,
  });
  const body = res.data;
  if (!body.success || !body.data) throw new Error(body.error || "Unable to start checkout");

  if (body.data.provider === "free") {
    return { status: "activated", subscriptionId: body.data.subscriptionId };
  }

  const cp = body.data.clientParams;
  if (!cp || cp.provider !== "razorpay") {
    throw new Error("No payment provider is available. Please contact support.");
  }

  await loadRazorpaySdk();
  if (!window.Razorpay) throw new Error("Razorpay failed to initialise");
  const rzp = new window.Razorpay({
    key: cp.keyId,
    order_id: cp.orderId,
    amount: cp.amount,
    currency: cp.currency,
    name: "Imperialpedia",
    description: `${cp.name} subscription`,
    // The payment is captured here; the backend webhook is the source of truth for activation.
    handler: () => args.onSuccess?.(),
    modal: { ondismiss: () => { /* buyer closed the modal — no charge taken */ } },
    theme: { color: "#7C3AED" },
  });
  rzp.open();
  return { status: "modal_open" };
}

export async function getConfiguredPaymentProvider(): Promise<{ configured: boolean }> {
  try {
    const res = await apiClient.get<{ success: boolean; data?: { providers: string[] } }>(
      "/payments/provider",
    );
    const providers = res.data?.data?.providers ?? [];
    return { configured: providers.includes("razorpay") };
  } catch {
    return { configured: false };
  }
}
