/**
 * Gateway checkout client — the ONLY payment integration point in the frontend.
 * Identical contract to the Proxy-BaalvionStack copy: NO payment logic, NO keys,
 * NO card fields. The browser calls this site's OWN backend (insiders-service)
 * BFF, which calls the SDK-native payment-service server-to-server and resolves
 * provider + keys from the CMS vault. We then hand off to the provider's HOSTED
 * checkout (Razorpay Checkout.js / Stripe Checkout).
 *
 * BFF contract (implement in insiders-service, mirroring proxy-service/routes/billingRoutes.js):
 *   POST {BASE}/billing/checkout  body { amount, currency, idempotencyKey, receipt? }
 *     -> 200 { provider, mode, orderId, amount, currency, clientKey, checkoutUrl? }
 *   (BFF calls payment-service POST /v1/gateway/payments with x-internal-secret;
 *    websiteSlug = 'baalvion-elite-circle', from server config — never the browser.)
 */

const BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_GATEWAY_URL ??
  "http://localhost:4000/v1";

export interface CheckoutRequest {
  amount: number;          // minor units (paise/cents)
  currency: string;
  idempotencyKey: string;
  receipt?: string;
  customer?: { name?: string; email?: string; contact?: string };
}

export interface CheckoutInit {
  provider: "razorpay" | "stripe" | "payu";
  mode: "live" | "mock";
  orderId: string;
  amount: number;
  currency: string;
  clientKey: string;       // PUBLIC key (razorpay key_id / stripe publishable key)
  checkoutUrl?: string;    // stripe Checkout Session url
}

export type CheckoutResult =
  | { status: "success"; provider: string; reference: string }
  | { status: "cancelled" }
  | { status: "failed"; message: string };

async function createIntent(req: CheckoutRequest): Promise<CheckoutInit> {
  const res = await fetch(`${BASE}/billing/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
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

export async function startGatewayCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
  const init = await createIntent(req);

  // LOCAL/TEST: mock mode has no real provider order → simulate the hosted step.
  // The same code opens the REAL widget once the tenant is mode='live' + hosted.
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
    window.location.href = init.checkoutUrl;
    return { status: "success", provider: "stripe", reference: init.orderId };
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
        name: "Baalvion Elite Circle",
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

  throw new Error(`Unsupported provider: ${init.provider}`);
}
