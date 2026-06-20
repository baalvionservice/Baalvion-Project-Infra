/**
 * Gateway checkout client — the ONLY payment integration point in the frontend.
 *
 * It deliberately contains NO payment logic, NO provider keys, and NO card fields.
 * The browser calls the site's OWN backend (BFF), which calls the SDK-native
 * payment-service server-to-server (holding the internal secret). The BFF returns
 * the provider + order params; we then hand off to the provider's HOSTED checkout
 * (Razorpay Checkout.js / Stripe Checkout). Cards/secrets never touch this app.
 *
 * BFF contract (implement in proxy-service / insiders-service):
 *   POST {VITE_API_PLATFORM_BASE_URL}/billing/checkout
 *     body: { amount, currency, idempotencyKey, receipt? }
 *     -> 200 { provider, mode, orderId, amount, currency, clientKey, checkoutUrl? }
 *   (the BFF calls payment-service POST /v1/gateway/payments with x-internal-secret,
 *    resolves websiteSlug from the authenticated org — never from the browser.)
 */

import { tokenStore } from "@/lib/tokenStore";

// In production builds the localhost fallback MUST NOT ship: an unset env var
// must fail loudly / resolve relative, never silently route checkout to a dev
// machine. Localhost is a DEV-ONLY default (guarded by import.meta.env.PROD).
const PLATFORM_BASE =
  import.meta.env.VITE_API_PLATFORM_BASE_URL?.trim() ||
  (import.meta.env.PROD ? "" : "http://localhost:4000/v1");

export type GatewayProvider = "razorpay" | "stripe" | "payu" | "cashfree";
export type GatewayMethod = "CARD" | "UPI" | "NETBANKING" | "BANK";

export interface CheckoutRequest {
  provider: GatewayProvider; // the shopper's chosen gateway
  method?: GatewayMethod;    // payment method (default CARD)
  amount: number;          // minor units (paise/cents) — DISPLAY only; the BFF recomputes the real charge
  currency: string;        // 'INR' | 'USD' | ...
  idempotencyKey: string;  // dedup a double-click / retry
  receipt?: string;
  customer?: { name?: string; email?: string; contact?: string };
  // The BFF prices the charge server-side from these (it never trusts `amount`); planSlug + interval
  // also flow into the provider order `notes` so the webhook can activate the right subscription.
  planSlug?: string;
  interval?: "monthly" | "yearly";
  promoCode?: string;
}

export interface CheckoutInit {
  provider: GatewayProvider;
  mode: "live" | "mock";
  orderId: string;
  amount: number;
  currency: string;
  clientKey: string;       // razorpay key_id / stripe publishable key (PUBLIC, safe in browser)
  checkoutUrl?: string;    // stripe Checkout Session url (redirect flow)
  // Full provider-public params: Razorpay {key,orderId,amount,name,currency};
  // PayU {txnid,amount,firstname,email,productinfo,hash,key,currency}; Stripe {publishableKey,...}.
  clientParams?: Record<string, string>;
}

export type CheckoutResult =
  | { status: "success"; provider: string; reference: string }
  // The browser is leaving for a hosted page (Stripe redirect / PayU form-POST). NOT paid yet —
  // settlement arrives via the provider webhook → ledger. Callers must NOT treat this as success.
  | { status: "redirecting"; provider: string; reference: string }
  | { status: "cancelled" }
  | { status: "failed"; message: string };

/** Ask our backend to create a payment intent (it proxies to payment-service). */
async function createIntent(req: CheckoutRequest): Promise<CheckoutInit> {
  // /billing/checkout is guarded by authMiddleware, which requires the Bearer ACCESS token (it does
  // not read the refresh cookie). Attach it from the in-memory tokenStore exactly like platformClient.
  const token = tokenStore.getAccess();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${PLATFORM_BASE}/billing/checkout`, {
    method: "POST",
    headers,
    credentials: "include", // also send the refresh cookie (same-origin host) for completeness
    body: JSON.stringify({ ...req, method: req.method ?? "CARD" }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || e?.message || `checkout init failed (HTTP ${res.status})`);
  }
  return res.json();
}

let razorpayScript: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  if (razorpayScript) return razorpayScript;
  razorpayScript = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => { razorpayScript = null; reject(new Error("failed to load Razorpay Checkout")); };
    document.body.appendChild(s);
  });
  return razorpayScript;
}

let cashfreeScript: Promise<void> | null = null;
function loadCashfree(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as unknown as { Cashfree?: unknown }).Cashfree) return Promise.resolve();
  if (cashfreeScript) return cashfreeScript;
  cashfreeScript = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve();
    s.onerror = () => { cashfreeScript = null; reject(new Error("failed to load Cashfree SDK")); };
    document.body.appendChild(s);
  });
  return cashfreeScript;
}

/**
 * Start checkout. Resolves when the user completes/cancels the provider's hosted
 * flow. The authoritative payment state still comes from the provider webhook →
 * payment-service ledger; this resolution is only for UI feedback.
 */
export async function startGatewayCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
  const init = await createIntent(req);

  // LOCAL/TEST: in mock mode there is no real provider order, so simulate the
  // hosted step (a real widget would reject a mock order id). The branches below
  // open the REAL Razorpay/Stripe checkout once the tenant is mode='live' + hosted.
  if (init.mode === "mock") {
    const ok = window.confirm(
      `[TEST MODE — ${init.provider}] Simulate a SUCCESSFUL payment of ` +
      `${(init.amount / 100).toFixed(2)} ${init.currency}?\n\nOK = success · Cancel = cancelled`,
    );
    return ok
      ? { status: "success", provider: init.provider, reference: init.orderId }
      : { status: "cancelled" };
  }

  if (init.provider === "stripe" && init.checkoutUrl) {
    window.location.href = init.checkoutUrl; // hosted Stripe Checkout (redirect)
    return { status: "redirecting", provider: "stripe", reference: init.orderId };
  }

  if (init.provider === "payu") {
    // PayU is a redirect/form-POST: build a signed form from the provider-public clientParams and
    // submit it to PayU's hosted page. The action URL is env-configurable (test vs secure PayU).
    const cp = init.clientParams || {};
    // Production-aware default: a prod build defaults to the LIVE PayU endpoint so a missing
    // build arg never silently routes real customers through the sandbox (broken payments);
    // dev defaults to the test endpoint. Always overridable via VITE_PAYU_ACTION_URL.
    const action =
      import.meta.env.VITE_PAYU_ACTION_URL?.trim() ||
      (import.meta.env.PROD ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment");
    // PayU browser-POSTs the result to surl (success) / furl (failure). Point both at our same-origin
    // callback, which verifies PayU's reverse-hash, activates, and redirects back to the app. surl/furl
    // are NOT part of the PayU request hash, so adding them here doesn't affect verification.
    const callbackUrl = `${window.location.origin}/v1/billing/webhook/payu`;
    const params: Record<string, string> = { ...cp, surl: callbackUrl, furl: callbackUrl };
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    Object.entries(params).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    // The browser leaves this page for PayU; settlement returns via the provider webhook → ledger.
    return { status: "redirecting", provider: "payu", reference: init.orderId };
  }

  if (init.provider === "razorpay") {
    await loadRazorpay();
    return new Promise<CheckoutResult>((resolve) => {
      const RazorpayCtor = (window as unknown as { Razorpay: new (o: unknown) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } }).Razorpay;
      const rzp = new RazorpayCtor({
        key: init.clientKey,
        order_id: init.orderId,
        amount: init.amount,
        currency: init.currency,
        name: "Baalvion",
        prefill: req.customer,
        modal: { ondismiss: () => resolve({ status: "cancelled" }) },
        handler: (r: unknown) => {
          const ref = (r as { razorpay_payment_id?: string })?.razorpay_payment_id || init.orderId;
          resolve({ status: "success", provider: "razorpay", reference: ref });
        },
      });
      rzp.on("payment.failed", (r: unknown) => {
        const msg = (r as { error?: { description?: string } })?.error?.description || "payment failed";
        resolve({ status: "failed", message: msg });
      });
      rzp.open();
    });
  }

  if (init.provider === "cashfree") {
    // Cashfree v3 SDK: hand the payment_session_id to cashfree.checkout(), which redirects to the
    // hosted page. Settlement returns via the S2S webhook → ledger; return_url lands the shopper back.
    await loadCashfree();
    const cp = init.clientParams || {};
    const mode = cp.mode === "production" ? "production" : "sandbox";
    const Cashfree = (window as unknown as { Cashfree: (o: unknown) => { checkout: (o: unknown) => void } }).Cashfree;
    const cf = Cashfree({ mode });
    cf.checkout({ paymentSessionId: cp.paymentSessionId, redirectTarget: "_self" });
    return { status: "redirecting", provider: "cashfree", reference: init.orderId };
  }

  throw new Error(`Unsupported provider: ${init.provider}`);
}
