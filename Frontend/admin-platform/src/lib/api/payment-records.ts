import { adminApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

// Cross-estate payment records — every payment taken on any Baalvion property, read from
// admin-service's read model rather than fanned out to each site at page load. A site being
// unreachable no longer blanks the figures.

/** Money as it travels: an integer count of minor units in a string, never a float. */
export interface MoneyJSON {
  amount: string;
  currency: string;
  exponent: number;
}

export type PaymentState = 'INITIATED' | 'AUTHORIZED' | 'CAPTURED' | 'SETTLED' | 'FAILED';

export interface PaymentRecordRow {
  paymentId: string;
  siteId: string;
  siteName: string;
  tenantId: string | null;
  partyId: string | null;
  state: PaymentState;
  provider: string;
  rail: string;
  providerPaymentId: string | null;
  money: MoneyJSON;
  amountDisplay: string;
  /** Null when the processor has not reported its fee — deliberately not zero. */
  fee: MoneyJSON | null;
  net: MoneyJSON | null;
  orderRef: string | null;
  failureReason: string | null;
  occurredAt: string;
}

export interface PaymentRecordsPage {
  payments: PaymentRecordRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface SiteCurrencyTotal {
  money: MoneyJSON;
  display: string;
  fees: MoneyJSON;
  feesDisplay: string;
  net: MoneyJSON;
  netDisplay: string;
  /** 'partial' when some payments in the total have no fee recorded. */
  feeCoverage: 'complete' | 'partial' | null;
  paymentsMissingFee: number;
  paymentCount: number;
  lastPaymentAt: string | null;
}

export interface SiteSummary {
  siteId: string;
  siteName: string;
  rails: string[];
  /** One entry per currency. Never summed across currencies — that number would be meaningless. */
  totals: SiteCurrencyTotal[];
  paymentCount: number;
}

export interface PaymentRecordsFilters {
  siteId?: string;
  state?: PaymentState;
  provider?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const paymentRecordsApi = {
  list: (params?: PaymentRecordsFilters) =>
    adminApiClient.get<ApiResponse<PaymentRecordsPage>>('/admin/payments/records', { params }),
  summary: (params?: { from?: string; to?: string }) =>
    adminApiClient.get<ApiResponse<{ sites: SiteSummary[] }>>('/admin/payments/records/summary', { params }),
};

// ── Party graph ────────────────────────────────────────────────────────────────
// One identity per human across every property. Matches that cannot be settled safely are
// queued rather than guessed — a wrong merge joins two people's payment history.

export interface PartyReview {
  id: string;
  reason: string;
  signal: {
    siteId?: string;
    email?: string | null;
    emailVerified?: boolean;
    phone?: string | null;
    name?: string | null;
    siteCustomerId?: string | null;
  };
  conflicts: string[];
  siteId: string | null;
  createdAt: string;
}

export interface PartyKey {
  key: string;
  strength: 'STRONG' | 'WEAK';
  first_site: string | null;
  created_at: string;
}

export interface PartyDetail {
  party: {
    party_id: string;
    display_name: string | null;
    primary_email: string | null;
    status: string;
    merged_into: string | null;
    created_at: string;
  };
  keys: PartyKey[];
  payments: Array<Record<string, unknown>>;
}

export type ReviewAction = 'merge' | 'separate' | 'dismiss';

export const partyApi = {
  reviews: () => adminApiClient.get<ApiResponse<{ reviews: PartyReview[] }>>('/admin/payments/parties/reviews'),
  resolve: (id: string, body: { action: ReviewAction; survivorId?: string }) =>
    adminApiClient.post<ApiResponse<{ resolved: boolean; action: string }>>(`/admin/payments/parties/reviews/${id}/resolve`, body),
  detail: (id: string) => adminApiClient.get<ApiResponse<PartyDetail>>(`/admin/payments/parties/${id}`),
};
