// The one-time buyer access pass: pay to enter the marketplace and buy. Same payment flow as the
// seller category payments (same addresses, same hash submission, same admin confirmation).
import { submitPaymentHash, type CategoryPayment, type PaymentMethod } from './seller-access';

const PROXY_BASE = '/api/commerce-proxy';

export interface BuyerAccessStatus {
  hasAccess: boolean;
  reason: 'paid' | 'seller' | 'admin' | null;
  priceUsd: number;
  payment: (CategoryPayment & { kind: 'buyer_access' }) | null;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.error?.message || `Request failed (${res.status})`);
  return body.data as T;
}

export const getBuyerAccess = () => call<BuyerAccessStatus>('/buyer-access/me');
export const startAccessPass = (currency: PaymentMethod, network?: string) =>
  call<CategoryPayment>('/buyer-access', { method: 'POST', body: JSON.stringify({ currency, network }) });
export { submitPaymentHash };
