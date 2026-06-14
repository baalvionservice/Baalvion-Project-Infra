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

const PLATFORM_BASE = import.meta.env.VITE_API_PLATFORM_BASE_URL ?? "http://localhost:4000/v1";

export type GatewayProvider = "razorpay" | "stripe" | "payu";
export type GatewayMethod = "CARD" | "UPI" | "NETBANKING" | "BANK";

export interface CheckoutRequest {
  provider: GatewayProvider; // the shopper's chosen gateway
  method?: GatewayMethod;    // payment method (default CARD)
  amount: number;          // minor units (paise/cents)
  currency: string;        // 'INR' | 'USD' | ...
  idempotencyKey: string;  // dedup a double-click / retry
  receipt?: string;
  customer?: { name?: string; email?: string; contact?: string };
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
  | { status: "cancelled" }
  | { status: "failed"; message: string };

/** Ask our backend to create a payment intent (it proxies to payment-service). */
async function createIntent(req: CheckoutRequest): Promise<CheckoutInit> {
  const res = await fetch(`${PLATFORM_BASE}/billing/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include", // BFF auth cookie/session; tenant comes from the verified session, not the browser
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
    return { status: "success", provider: "stripe", reference: init.orderId };
  }

  if (init.provider === "payu") {
    // PayU is a redirect/form-POST: build a signed form from the provider-public clientParams and
    // submit it to PayU's hosted page. The action URL is env-configurable (test vs secure PayU).
    const cp = init.clientParams || {};
    const action = import.meta.env.VITE_PAYU_ACTION_URL ?? "https://test.payu.in/_payment";
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    Object.entries(cp).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    // The browser leaves this page for PayU; settlement returns via the provider webhook → ledger.
    return { status: "success", provider: "payu", reference: init.orderId };
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

  throw new Error(`Unsupported provider: ${init.provider}`);
}
