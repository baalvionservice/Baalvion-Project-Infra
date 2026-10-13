// Category payments, token wallet and the paid admin chat. All calls go through the same-origin
// /api/commerce-proxy bridge, like lib/api/commerce-admin.ts.

const PROXY_BASE = '/api/commerce-proxy';

export type PaymentMethod = 'BTC' | 'USDT' | 'BINANCE';

export type PaymentStatus = 'awaiting_payment' | 'payment_submitted' | 'active' | 'rejected' | 'forfeited';

export interface CategoryPayment {
  id: string;
  sellerUserId: string;
  kind?: 'category' | 'buyer_access' | 'wallet_topup' | 'agent_activation' | 'community_tier';
  tierSlug?: string | null;
  categoryId: string | null;
  amountUsd: string;
  currency: PaymentMethod;
  status: PaymentStatus;
  txHash: string | null;
  amountReceived: string | null;
  note: string | null;
  createdAt: string;
  payTo?: {
    address: string | null; network: string | null; networkLabel: string | null; method: PaymentMethod; label: string; recipient: string | null;
    // Binance Pay: the QR the payer scans and the link that opens it in the Binance app.
    qrImageUrl?: string | null; payLink?: string | null;
  };
  // How long an admin takes to check a payment; once submitted, also when it was sent and when it should be done.
  review?: PaymentReview;
  submittedAt?: string | null;
  reviewWaitMinutes?: number | null;
  proofCount?: number;
  // Admin list only.
  categoryName?: string | null;
  sellerName?: string | null;
  storeName?: string | null;
  memberNumber?: string | null;
  intermediaryId?: string | null;
  intermediaryName?: string | null;
}

export interface PaymentReview { waitMinutes: number; submittedAt: string | null; reviewBy: string | null }
export interface PaymentProof { id: string; mime: string; sizeBytes: number; createdAt: string; dataUrl: string }
export interface ProofUpload { mime: 'image/jpeg' | 'image/png' | 'image/webp'; data: string }

export interface ChatSession {
  id: string;
  startsAt: string;
  expiresAt: string;
  alreadyActive?: boolean;
}

export interface SellerWallet {
  balance: number;
  withdrawable: false;
  adminChat: { costTokens: number; minutes: number; activeSession: ChatSession | null };
}

export interface ChatMessage {
  id: string;
  senderRole: 'seller' | 'admin';
  body: string;
  createdAt: string;
}

export interface AdminChatSession {
  id: string;
  sellerUserId: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  memberNumber?: string | null;
  messageCount?: number;
  lastMessage?: string | null;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `Request failed (${res.status})`);
  }
  return body.data as T;
}

const post = <T>(path: string, data?: unknown) =>
  call<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });

// Seller
export const listMyPayments = () => call<CategoryPayment[]>('/seller-bonds/mine');
export const startCategoryPayment = (categoryId: string, currency: PaymentMethod, network?: string) =>
  post<CategoryPayment>('/seller-bonds', { categoryId, currency, network });
// A payer proves payment with a screenshot, a transaction reference, or both.
export const submitPayment = (id: string, body: { txHash?: string; proofs?: ProofUpload[] }) =>
  post<CategoryPayment>(`/seller-bonds/${id}/payment`, body);
export const submitPaymentHash = (id: string, txHash: string) => submitPayment(id, { txHash });
export const listPaymentProofs = (id: string) => call<PaymentProof[]>(`/seller-bonds/${id}/proofs`);
export const getAutoPublish = () => call<{ autoPublishListings?: boolean }>('/payment-settings').then((r) => r.autoPublishListings !== false);
export const setAutoPublish = (autoPublishListings: boolean) =>
  call<{ autoPublishListings: boolean }>('/payment-settings/auto-publish', { method: 'PUT', body: JSON.stringify({ autoPublishListings }) });
export const getReviewWait = () => call<{ reviewWaitMinutes: number; min: number; max: number }>('/payment-settings');
export const setReviewWait = (reviewWaitMinutes: number) =>
  call<{ reviewWaitMinutes: number }>('/payment-settings', { method: 'PUT', body: JSON.stringify({ reviewWaitMinutes }) });
export const getWallet = () => call<SellerWallet>('/seller-tokens/wallet');
export const startAdminChat = () => post<ChatSession & { balance: number }>('/seller-tokens/admin-chat');
export const getMyChat = (after?: string) =>
  call<{ session: ChatSession | null; messages: ChatMessage[] }>(`/seller-tokens/admin-chat/active${after ? `?after=${encodeURIComponent(after)}` : ''}`);
export const sendMyChatMessage = (body: string) => post<ChatMessage>('/seller-tokens/admin-chat/messages', { body });

// Admin
export async function listAllPayments(status?: string): Promise<CategoryPayment[]> {
  return call<CategoryPayment[]>(`/seller-bonds?limit=100${status ? `&status=${status}` : ''}`);
}
export const confirmPayment = (id: string, amountReceived: string, note?: string, creditUsd?: number) =>
  post<CategoryPayment>(`/seller-bonds/${id}/confirm`, { amountReceived, note, creditUsd });
export const rejectPayment = (id: string, note: string) => post<CategoryPayment>(`/seller-bonds/${id}/reject`, { note });
export const revokePayment = (id: string, note: string) => post<CategoryPayment>(`/seller-bonds/${id}/forfeit`, { note });
export const listChatSessions = () => call<AdminChatSession[]>('/seller-tokens/admin-chat/sessions');
export const getChatSession = (id: string, after?: string) =>
  call<{ session: AdminChatSession; messages: ChatMessage[] }>(`/seller-tokens/admin-chat/sessions/${id}${after ? `?after=${encodeURIComponent(after)}` : ''}`);
export const sendAdminChatMessage = (id: string, body: string) => post<ChatMessage>(`/seller-tokens/admin-chat/sessions/${id}/messages`, { body });

// Which ways to pay are switched on right now (no addresses: those are issued with a payment).
export interface PaymentNetworkInfo { network: string; label: string; available: boolean }
export interface PaymentMethodInfo { method: PaymentMethod; label: string; available: boolean; networks: PaymentNetworkInfo[] }
// Switch how an unpaid payment is made (USDT, Bitcoin or Binance Pay); the address changes with it.
export const changePaymentMethod = (id: string, currency: PaymentMethod, network?: string) => post<CategoryPayment>(`/seller-bonds/${id}/method`, { currency, network });
// Switch the chain of an unpaid USDT payment; the address changes with it.
export const changePaymentNetwork = (id: string, network: string) => post<CategoryPayment>(`/seller-bonds/${id}/network`, { network });
export const listPaymentMethods = () => call<PaymentMethodInfo[]>('/payment-destinations/available');

// Super admin: where sellers send payments. One entry per network (Binance Pay has a single entry with no network).
export interface PaymentDestinationEntry {
  network: string; networkLabel: string; configured: boolean; source: 'database' | 'env' | 'none';
  address: string | null; label: string | null; isActive: boolean; updatedBy: string | null; updatedAt: string | null;
}
export interface PaymentDestination { method: PaymentMethod; label: string; idLabel: string; entries: PaymentDestinationEntry[] }
export interface PaymentDestinationChange {
  method: PaymentMethod; network: string | null; oldAddress: string | null; newAddress: string | null;
  action: string; changedBy: string | null; createdAt: string;
}
export const listDestinations = () => call<PaymentDestination[]>('/payment-destinations');
export const destinationHistory = () => call<PaymentDestinationChange[]>('/payment-destinations/history');
export const saveDestination = (method: PaymentMethod, body: { address: string; confirmAddress: string; network?: string | null; label?: string | null; isActive?: boolean }) =>
  call<{ method: PaymentMethod; network: string | null; address: string; label: string | null }>(`/payment-destinations/${method}`, { method: 'PUT', body: JSON.stringify(body) });
