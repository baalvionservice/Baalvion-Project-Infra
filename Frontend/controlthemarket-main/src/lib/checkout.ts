// Browser-side checkout orchestration for ControlTheMarket.
//
// Calls the server-authoritative POST /payments/checkout (the charge amount is computed from
// the plan on the backend — NEVER trusted from here), then drives the buyer's chosen provider:
//   • Stripe   → redirect to the hosted Checkout URL the backend returned
//   • Razorpay → open the hosted Razorpay Checkout modal with the PUBLIC key + order id
//   • PayU     → auto-submit the signed (hash) form to PayU's hosted page
//   • Cashfree → load the v3 SDK and redirect to Cashfree's hosted checkout with the session id
// No secret key ever touches the client — only the `clientParams` the backend returns.
// Activation is authoritative server-side via the signature-verified webhook / PayU return, so a
// closed tab or refresh still results in an active subscription.

import { createPaymentCheckout } from './write-api';

export type CheckoutProvider = 'stripe' | 'razorpay' | 'payu' | 'cashfree';

export type StartCheckoutArgs = {
  planId: string;
  provider: CheckoutProvider;
  billingCycle?: 'monthly' | 'annual';
  email?: string;
};

const RAZORPAY_SDK = 'https://checkout.razorpay.com/v1/checkout.js';
const CASHFREE_SDK = 'https://sdk.cashfree.com/js/v3/cashfree.js';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
    Cashfree?: (opts: { mode: string }) => { checkout: (opts: Record<string, unknown>) => void };
  }
}

// Inject a third-party SDK <script> once and resolve when it's ready. Reuses an in-flight tag so
// repeated checkout attempts don't stack duplicate scripts.
function loadSdk(src: string, isReady: () => boolean, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error(`${label} requires a browser`));
    if (isReady()) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${label}`)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${label}`));
    document.body.appendChild(s);
  });
}

// Build + auto-submit a hidden form POST (PayU's hosted page). The fields are the backend-signed,
// non-secret params; only the `action` host the backend resolved is ever POSTed to.
function submitForm(action: string, fields: Record<string, string>): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

// Start a checkout. Resolves once the provider UX has been handed off (Stripe/Cashfree redirect or
// PayU form-POST kicked off, or the Razorpay modal opened). Throws on a misconfigured/missing
// provider so the caller can surface an error instead of a silent no-charge.
export async function startCheckout(args: StartCheckoutArgs): Promise<{ status: 'redirecting' | 'modal_open' }> {
  const { data } = await createPaymentCheckout({
    planId: args.planId,
    provider: args.provider,
    billingCycle: args.billingCycle ?? 'monthly',
    email: args.email,
  });

  const cp = (data?.clientParams ?? {}) as Record<string, unknown>;
  const provider = String(cp.provider ?? data?.provider ?? '');

  if (provider === 'stripe') {
    const url = (cp.checkoutUrl as string) ?? data?.checkoutUrl;
    // Defense-in-depth: only ever redirect to Stripe's own hosted checkout, never an arbitrary
    // URL — so a tampered response can't turn this into an open redirect.
    if (!url || !String(url).startsWith('https://checkout.stripe.com/')) {
      throw new Error('Invalid Stripe checkout URL');
    }
    window.location.assign(url);
    return { status: 'redirecting' };
  }

  if (provider === 'razorpay') {
    await loadSdk(RAZORPAY_SDK, () => Boolean(window.Razorpay), 'Razorpay');
    if (!window.Razorpay) throw new Error('Razorpay failed to initialise');
    const rzp = new window.Razorpay({
      key: cp.keyId,
      order_id: cp.orderId,
      amount: cp.amount,
      currency: cp.currency,
      name: (cp.name as string) ?? 'ControlTheMarket',
      description: cp.name ? `${cp.name} subscription` : 'Subscription',
      prefill: cp.prefillEmail ? { email: cp.prefillEmail } : undefined,
      // The payment is captured here; the backend webhook is the source of truth for activation.
      handler: () => window.location.assign('/company/billing?paid=1'),
      modal: { ondismiss: () => { /* buyer closed the modal — no charge taken */ } },
      theme: { color: '#6d28d9' },
    });
    rzp.open();
    return { status: 'modal_open' };
  }

  if (provider === 'payu') {
    const action = String(cp.action ?? '');
    const fields = (cp.fields ?? {}) as Record<string, string>;
    // Only ever POST to PayU's own hosted endpoint (the backend resolved + allowlisted the host from
    // the vault). Covers India (payu.in) and international (payu.com) merchant domains.
    if (!/^https:\/\/(secure|test|sandbox)\.payu\.(in|com)\//.test(action)) {
      throw new Error('Invalid PayU checkout endpoint');
    }
    submitForm(action, fields);
    return { status: 'redirecting' };
  }

  if (provider === 'cashfree') {
    const sessionId = cp.paymentSessionId as string | undefined;
    const mode = (cp.mode as string) === 'production' ? 'production' : 'sandbox';
    if (!sessionId) throw new Error('Cashfree session could not be created');
    await loadSdk(CASHFREE_SDK, () => typeof window.Cashfree === 'function', 'Cashfree');
    if (typeof window.Cashfree !== 'function') throw new Error('Cashfree failed to initialise');
    const cashfree = window.Cashfree({ mode });
    // Redirect the current tab to Cashfree's hosted checkout; activation is via the signed webhook.
    cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_self' });
    return { status: 'redirecting' };
  }

  throw new Error('No payment provider is available. Please contact support.');
}
