// Intermediaries: the public directory, applying to become one, and trades with chat and payment screenshots.
// All calls go through the same-origin /api/commerce-proxy bridge.
import type { CategoryPayment, ProofUpload } from './seller-access';

const BASE = '/api/commerce-proxy';

export type ServiceType = 'buy_usdt' | 'crypto_trade' | 'account_setup' | 'other';
export const SERVICE_LABEL: Record<ServiceType, string> = {
  buy_usdt: 'Buy USDT', crypto_trade: 'Crypto trade', account_setup: 'Account setup', other: 'Other help',
};

export interface Intermediary {
  id: string; slug: string; displayName: string; bio: string | null; services: ServiceType[]; languages: string[];
  commissionNote: string | null; tradeLimitUsd: number | null; verified: boolean; depositUsd: number;
  listedSince: string; completedTrades: number; qrs: { id: string; label: string }[];
}
export interface OwnIntermediary extends Intermediary { status: 'applied' | 'payment_submitted' | 'active' | 'rejected' | 'suspended'; userId: string | null }
export interface AdminApplication extends OwnIntermediary { createdAt: string; qrImages?: { id: string; label: string; dataUrl: string }[] }

export type TradeStatus = 'created' | 'payment_submitted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export interface Trade {
  id: string; ref: string; status: TradeStatus; serviceType: ServiceType; amountUsdt: number | null; instructions: string | null;
  intermediary: { id: string; name: string; slug: string }; role: 'customer' | 'intermediary' | 'admin';
  customerUserId: string; createdAt: string; updatedAt: string; paidAt: string | null; completedAt: string | null;
  cancelledBy: string | null; disputeReason: string | null; resolutionNote: string | null;
}
export interface TradeMessage { id: string; senderUserId: string; senderRole: 'customer' | 'intermediary' | 'admin'; body: string; createdAt: string }
export interface TradeDetail extends Trade {
  messages: TradeMessage[]; proofs: { id: string; uploaderRole: string; mime: string; sizeBytes: number; createdAt: string }[];
  payQrs: { id: string; label: string }[];
}
export interface TradeProofImage { id: string; uploaderRole: string; createdAt: string; dataUrl: string }

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) }, credentials: 'include', cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const err = new Error(body.error?.message || `Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return body.data as T;
}
const post = <T>(path: string, data?: unknown) => call<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });

// Public
export const listIntermediaries = () => call<{ items: Intermediary[]; total: number }>('/public/intermediaries');
export const getIntermediary = (slug: string) => call<Intermediary>(`/public/intermediaries/${encodeURIComponent(slug)}`);
export const qrUrl = (intermediaryId: string, qrId: string) => `${BASE}/public/intermediaries/${intermediaryId}/qr/${qrId}`;

// Applicant
export interface ApplyBody {
  displayName: string; bio?: string; services: ServiceType[]; languages?: string[]; commissionNote?: string; tradeLimitUsd?: number;
  qrs: (ProofUpload & { label?: string })[]; currency: 'BTC' | 'USDT' | 'BINANCE'; network?: 'TRC20' | 'BEP20' | 'ERC20' | 'SOLANA';
}
export const myIntermediary = () => call<{ intermediary: OwnIntermediary | null; payment: CategoryPayment | null }>('/intermediaries/mine');
export const applyToBeIntermediary = (body: ApplyBody) => post<{ intermediaryId: string; payment: CategoryPayment }>('/intermediaries/apply', body);

// Admin
export const adminApplications = (status?: string) => call<AdminApplication[]>(`/intermediaries/admin${status ? `?status=${status}` : ''}`);
export const adminApplication = (id: string) => call<AdminApplication>(`/intermediaries/admin/${id}`);

// Trades
export const listTrades = () => call<{ items: Trade[]; total: number; isIntermediary: boolean }>('/intermediary-trades');
export const createTrade = (body: { intermediaryId: string; serviceType: ServiceType; amountUsdt?: number; instructions?: string }) => post<Trade>('/intermediary-trades', body);
export const getTrade = (id: string) => call<TradeDetail>(`/intermediary-trades/${id}`);
export const tradeProofs = (id: string) => call<TradeProofImage[]>(`/intermediary-trades/${id}/proofs`);
export const sendTradeMessage = (id: string, body: string) => post<TradeDetail>(`/intermediary-trades/${id}/messages`, { body });
export const addTradeProofs = (id: string, proofs: ProofUpload[]) => post<TradeDetail>(`/intermediary-trades/${id}/proofs`, { proofs });
export const markTradePaid = (id: string, proofs: ProofUpload[], note?: string) => post<TradeDetail>(`/intermediary-trades/${id}/paid`, { proofs, note });
export const confirmTradePayment = (id: string) => post<TradeDetail>(`/intermediary-trades/${id}/confirm-payment`);
export const completeTrade = (id: string) => post<TradeDetail>(`/intermediary-trades/${id}/complete`);
export const cancelTrade = (id: string) => post<TradeDetail>(`/intermediary-trades/${id}/cancel`);
export const disputeTrade = (id: string, reason: string) => post<TradeDetail>(`/intermediary-trades/${id}/dispute`, { reason });

// Admin: disputes
export const adminTrades = (status?: string) => call<{ items: Trade[]; total: number }>(`/intermediary-trades/admin${status ? `?status=${status}` : ''}`);
export const adminTrade = (id: string) => call<TradeDetail>(`/intermediary-trades/admin/${id}`);
export const adminTradeProofs = (id: string) => call<TradeProofImage[]>(`/intermediary-trades/admin/${id}/proofs`);
export const resolveTrade = (id: string, outcome: 'completed' | 'cancelled', note: string) => post<TradeDetail>(`/intermediary-trades/admin/${id}/resolve`, { outcome, note });
