// Browser-side checkout orchestration for ControlTheMarket.
//
// Calls the server-authoritative POST /payments/checkout (the charge amount is computed from
// the plan on the backend — NEVER trusted from here), then drives the buyer's chosen provider:
//   • Stripe   → redirect to the hosted Checkout URL the backend returned
//   • Razorpay → open the hosted Razorpay Checkout modal with the PUBLIC key + order id
// No secret key ever touches the client — only the `clientParams` the backend returns.
// Activation is authoritative server-side via the signature-verified webhook, so a closed tab
// or refresh still results in an active subscription.

import { createPaymentCheckout } from './write-api';

export type CheckoutProvider = 'stripe' | 'razorpay';

export type StartCheckoutArgs = {
  planId: string;
  provider: CheckoutProvider;
  billingCycle?: 'monthly' | 'annual';
  email?: string;
};

const RAZORPAY_SDK = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpaySdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Razorpay requires a browser'));
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SDK}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const s = document.createElement('script');
    s.src = RAZORPAY_SDK;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(s);
  });
}

// Start a checkout. Resolves once the provider UX has been handed off (Stripe redirect kicked
// off, or the Razorpay modal opened). Throws on a misconfigured/missing provider so the caller
// can surface an error instead of a silent no-charge.
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
    if (!url) throw new Error('Stripe did not return a checkout URL');
    window.location.assign(url);
    return { status: 'redirecting' };
  }

  if (provider === 'razorpay') {
    await loadRazorpaySdk();
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

  throw new Error('No payment provider is available. Please contact support.');
}
