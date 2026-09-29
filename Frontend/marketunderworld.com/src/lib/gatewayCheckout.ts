/**
 * Membership checkout — the ONLY payment integration point in this frontend.
 *
 * No payment logic, no keys, no card fields. The browser calls this site's own backend
 * (insiders-service), which calls the JVM payment-service server-to-server and resolves the
 * provider + merchant keys from the CMS vault. We then hand off to the provider's HOSTED page.
 *
 * Two rules this file exists to enforce:
 *
 *  1. The browser names a TIER, never an amount. The price is quoted server-side from the tier
 *     catalogue and the caller's own membership row, so a tampered client cannot buy an Investor
 *     Partner membership for a dollar.
 *
 *  2. The browser NEVER decides that a payment succeeded. Completing the hosted step only means
 *     the provider took over; the membership is granted by payment-service's signed fulfilment
 *     callback. Callers must re-read membership from the server, which `awaitMembership` does.
 *     The previous version resolved `status: "success"` from a `window.confirm`, and the page
 *     believed it.
 */
import { authedFetch } from "@/integrations/supabase/client";

export type GatewayProvider = "razorpay" | "payu" | "cashfree" | "crypto";

export type MembershipTier = "founder" | "investor_partner";

export interface CheckoutInit {
  paymentId: string;
  provider: GatewayProvider;
  mode: "live" | "mock";
  orderId: string;
  /** Minor units, as an integer. Never divide this by a hardcoded 100 — see formatMinor. */
  amount: number;
  currency: string;
  quote: { tier: string; label: string; amount: number; proration: boolean; note: string; currency: string };
  clientParams: Record<string, string>;
}

export type CheckoutOutcome =
  /** The hosted step finished. NOT proof of payment — confirm against the server. */
  | { status: "submitted"; provider: string; reference: string }
  /** The browser is leaving for a hosted page; settlement arrives by webhook. */
  | { status: "redirecting"; provider: string; reference: string }
  /** Crypto: an address was issued and the transfer is on the user, not the browser. */
  | { status: "awaiting_transfer"; provider: string; reference: string; instructions: Record<string, string> }
  | { status: "cancelled" }
  | { status: "failed"; message: string };

/** Format integer minor units without assuming a 2-decimal currency. */
export function formatMinor(minor: number, currency: string): string {
  try {
    const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency });
    const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
    return fmt.format(minor / 10 ** digits);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await authedFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok || (json as { success?: boolean }).success === false) {
    const err = (json as { message?: string; error?: { message?: string } });
    throw new Error(err.error?.message || err.message || `checkout failed (HTTP ${res.status})`);
  }
  return (json as { data: T }).data;
}

export interface TierRow {
  key: MembershipTier;
  label: string;
  /** List price for the tier, in major units. */
  price: number;
  current: boolean;
  /** What this caller would actually pay right now, after any upgrade proration. */
  quote: CheckoutInit["quote"] | null;
}

export interface MembershipRow {
  plan?: string;
  status?: string;
  expires_at?: string;
}

export interface TierCatalogue {
  tiers: TierRow[];
  membership: MembershipRow | null;
  grace_days: number;
}

export async function fetchTiers(): Promise<TierCatalogue> {
  const res = await authedFetch("/billing/tiers");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "could not load membership tiers");
  return json.data as TierCatalogue;
}

let razorpayScript: Promise<void> | null = null;
function loadScript(src: string, ready: () => boolean, label: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (ready()) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${label}`));
    document.body.appendChild(s);
  });
}
function loadRazorpay(): Promise<void> {
  if (!razorpayScript) {
    razorpayScript = loadScript(
      "https://checkout.razorpay.com/v1/checkout.js",
      () => Boolean((window as unknown as { Razorpay?: unknown }).Razorpay),
      "Razorpay Checkout",
    ).catch((e) => { razorpayScript = null; throw e; });
  }
  return razorpayScript;
}

/**
 * Start a membership checkout and drive the provider's hosted step.
 *
 * Returns how the hosted step ended — never whether money moved.
 */
export async function startMembershipCheckout(tier: MembershipTier): Promise<CheckoutOutcome> {
  const init = await post<CheckoutInit>("/billing/checkout", { tier });
  const cp = init.clientParams || {};

  // Test-mode tenants have no real provider order. Say so plainly rather than offering a
  // "simulate a successful payment" dialog whose result the UI would then trust.
  if (init.mode === "mock") {
    return { status: "failed", message: "Payments are in test mode for this site — no charge can be taken yet." };
  }

  if (init.provider === "razorpay") {
    await loadRazorpay();
    return new Promise<CheckoutOutcome>((resolve) => {
      const Ctor = (window as unknown as {
        Razorpay: new (o: unknown) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
      }).Razorpay;
      const rzp = new Ctor({
        key: cp.key,
        order_id: cp.orderId || init.orderId,
        amount: init.amount,
        currency: init.currency,
        name: cp.name || "Baalvion Elite Circle",
        description: init.quote?.label,
        modal: { ondismiss: () => resolve({ status: "cancelled" }) },
        handler: (r: unknown) => {
          const ref = (r as { razorpay_payment_id?: string })?.razorpay_payment_id || init.orderId;
          // Submitted, not paid: the membership follows the webhook.
          resolve({ status: "submitted", provider: "razorpay", reference: ref });
        },
      });
      rzp.on("payment.failed", (r: unknown) => {
        const msg = (r as { error?: { description?: string } })?.error?.description || "payment failed";
        resolve({ status: "failed", message: msg });
      });
      rzp.open();
    });
  }

  if (init.provider === "payu") {
    // PayU is a form-POST to its hosted page. Every field below is provider-public and was
    // signed server-side; the browser only carries them.
    const action =
      (import.meta.env.VITE_PAYU_ACTION_URL as string | undefined)?.trim() ||
      (import.meta.env.PROD ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment");
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    const callbackUrl = `${window.location.origin}/membership`;
    const fields: Record<string, string> = { ...cp, surl: callbackUrl, furl: callbackUrl };
    for (const [k, v] of Object.entries(fields)) {
      if (v == null) continue;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    return { status: "redirecting", provider: "payu", reference: init.orderId };
  }

  if (init.provider === "cashfree") {
    await loadScript(
      "https://sdk.cashfree.com/js/v3/cashfree.js",
      () => Boolean((window as unknown as { Cashfree?: unknown }).Cashfree),
      "Cashfree SDK",
    );
    const factory = (window as unknown as { Cashfree: (o: unknown) => { checkout: (o: unknown) => Promise<unknown> } }).Cashfree;
    const cashfree = factory({ mode: cp.mode === "sandbox" ? "sandbox" : "production" });
    await cashfree.checkout({ paymentSessionId: cp.paymentSessionId, redirectTarget: "_self" });
    return { status: "redirecting", provider: "cashfree", reference: init.orderId };
  }

  if (init.provider === "crypto") {
    // Non-custodial: the gateway issues an address and watches the chain. Nothing to open.
    return { status: "awaiting_transfer", provider: "crypto", reference: init.orderId, instructions: cp };
  }

  return { status: "failed", message: `Unsupported payment provider: ${init.provider}` };
}

/**
 * Wait for the server to report the membership active.
 *
 * The webhook → fulfilment hop is asynchronous, so a page that re-read membership once,
 * immediately, would usually read it as still inactive and tell the user their payment failed.
 * Resolves false on timeout, which means "not confirmed yet", never "it failed".
 */
export async function awaitMembership(tier: MembershipTier, timeoutMs = 30_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  let delay = 1_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, delay));
    try {
      const { membership } = await fetchTiers();
      if (membership?.status === "active" && membership.plan === tier) return true;
    } catch {
      // A transient read failure is not an answer — keep waiting until the deadline.
    }
    delay = Math.min(delay * 1.5, 5_000);
  }
  return false;
}
