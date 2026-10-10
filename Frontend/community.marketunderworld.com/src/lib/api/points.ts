// The buyer's wallet: load it with crypto (an admin confirms), it becomes points, and points pay for
// orders. 100 points = $1 by default; the server tells us the rate so nothing here hard-codes it.
import { submitPaymentHash, type CategoryPayment, type PaymentMethod } from './seller-access';

export interface WalletEntry { id: string; delta: number; reason: 'topup' | 'purchase' | 'refund' | 'adjustment'; orderNumber: string | null; note: string | null; createdAt: string }

export interface PointsWallet {
  points: number;
  pointsPerUsd: number;
  usdValue: number;
  minTopupUsd: number;
  maxTopupUsd: number;
  openTopup: CategoryPayment | null;
  topups: CategoryPayment[];
  history: WalletEntry[];
}

export interface PointsReceipts {
  pointsPerUsd: number;
  totals: { spent: number; loaded: number; refunded: number; outstanding: number };
  receipts: {
    id: string; createdAt: string; points: number; buyerMemberNumber: string | null; orderNumber: string; orderId: string;
    orderStatus: string; paymentStatus: string; totalUsd: number;
    items: { name: string; quantity: number; lineUsd: number; sellerMemberNumber: string | null }[];
  }[];
}

async function call<T>(base: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw Object.assign(new Error(body.error?.message || `Request failed (${res.status})`), { code: body.error?.code as string | undefined, details: body.error?.details as { needed?: number; balance?: number; short?: number } | undefined });
  }
  return body.data as T;
}


export const getPointsWallet = () => call<PointsWallet>('/api/commerce-proxy', '/wallet/me');
export const startWalletTopup = (amountUsd: number, currency: PaymentMethod, network?: string) =>
  call<CategoryPayment>('/api/commerce-proxy', '/wallet/topups', { method: 'POST', body: JSON.stringify({ amountUsd, currency, network }) });
export const getPointsReceipts = () => call<PointsReceipts>('/api/commerce-proxy', '/wallet/admin/receipts?limit=200');
export const payOrderWithPoints = (storeId: string, orderId: string) =>
  call<{ order: { id: string; orderNumber: string }; points?: number; alreadyPaid: boolean }>('/api/order-proxy', `/stores/${storeId}/orders/${orderId}/pay-with-points`, { method: 'POST' });
export { submitPaymentHash };

export const formatPoints = (n: number) => `${n.toLocaleString()} pts`;
export const usdToPoints = (usd: number, perUsd: number) => Math.ceil(Math.round(usd * 100) * perUsd / 100);
