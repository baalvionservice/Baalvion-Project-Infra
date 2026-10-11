// Paid access tiers (Marketplace, Global Elite, VIP): pay the admin, attach a screenshot, an admin confirms, access is granted.
import { submitPayment, submitPaymentHash, type CategoryPayment, type PaymentMethod } from './seller-access';

const PROXY_BASE = '/api/commerce-proxy';

export interface TierStatus { slug: string; name: string; priceUsd: number; payment: CategoryPayment | null }

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) }, credentials: 'include', cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.error?.message || `Request failed (${res.status})`);
  return body.data as T;
}

export const getTierStatuses = () => call<{ tiers: TierStatus[] }>('/community-access/me');
export const startTierPayment = (tierSlug: string, currency: PaymentMethod, network?: string) =>
  call<CategoryPayment>('/community-access', { method: 'POST', body: JSON.stringify({ tierSlug, currency, network }) });
export { submitPayment, submitPaymentHash };
