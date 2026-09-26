// Shared client logic for rendering the checkout's gateway choices from the server-reported
// configured providers (so we only ever show gateways that can really charge). Used by the pricing
// dialog and the billing payment-method dialog.
'use client';

import { useEffect, useState } from 'react';
import { getConfiguredPaymentProviders } from './write-api';
import type { CheckoutProvider } from './checkout';

export const PROVIDER_LABELS: Record<CheckoutProvider, string> = {
  stripe: 'Stripe',
  razorpay: 'Razorpay · UPI / Cards / Netbanking',
  cashfree: 'Cashfree · UPI / Cards / Netbanking',
  payu: 'PayU · Cards / UPI / Wallets',
};

const ALL: CheckoutProvider[] = ['stripe', 'razorpay', 'cashfree', 'payu'];
const isProvider = (p: string): p is CheckoutProvider => (ALL as string[]).includes(p);

export type ConfiguredProviders = {
  providers: CheckoutProvider[];       // gateways to render (configured; falls back to ALL if unknown)
  preferred: CheckoutProvider | null;  // the "Pay by card" default
  loading: boolean;
};

// Fetch the configured providers when `enabled` (e.g. a checkout dialog opens). Degrades gracefully:
// if the endpoint is unavailable or reports none, we show ALL gateways so checkout is never blocked
// (an unconfigured pick still fails safely server-side).
export function useConfiguredProviders(enabled: boolean): ConfiguredProviders {
  const [providers, setProviders] = useState<CheckoutProvider[]>(ALL);
  const [preferred, setPreferred] = useState<CheckoutProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    getConfiguredPaymentProviders()
      .then(({ providers: list, preferred: def }) => {
        if (!active) return;
        const cfg = (list || []).filter(isProvider);
        const resolved = cfg.length ? cfg : ALL;          // degrade to all if none reported
        setProviders(resolved);
        const pref = def && isProvider(def) ? def : null;
        setPreferred(pref && resolved.includes(pref) ? pref : resolved[0] ?? null);
      })
      .catch(() => {
        if (!active) return;
        setProviders(ALL);
        setPreferred(ALL[0]);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled]);

  return { providers, preferred, loading };
}
