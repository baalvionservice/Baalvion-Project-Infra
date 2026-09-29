import { serviceClients } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

// Platform-wide (cross-store) order revenue aggregate — talks to order-service
// GET /orders/analytics/revenue (RS256, platform/super_admin or country_admin).
// Transport mirrors commerce-analytics.ts: serviceClients.orders carries the bearer
// via the shared attachToken interceptor. NO proxy apiClient, NO admin-service hop.
const orders = serviceClients.orders;

// ─── Response shapes (C2 contract) ────────────────────────────────────────────
// Earned revenue = rows with payment_status IN ('paid','partially_paid'); pending /
// cancelled / refunded are reported separately and NEVER summed into earned. Mixed
// currencies are never naively summed: each market keeps its native currency, and
// revenueBaseUsd is the FX-normalized total (USD).

export type MarketCode = 'us' | 'uk' | 'ae' | 'in' | 'sg';

export interface PlatformRevenueTotals {
  revenueBaseUsd: number; // FX-normalized earned revenue, USD whole units
  taxBaseUsd: number; // FX-normalized tax, USD whole units
  orders: number;
  baseCurrency: 'USD';
}

export interface MarketRevenue {
  market: MarketCode;
  revenue: number; // native market currency (NOT base USD)
  currencyCode: string;
  orders: number;
  sharePct: number; // share of total revenueBaseUsd
}

export interface StatusRevenue {
  status: string;
  count: number;
  revenue: number;
}

export interface RevenueSeriesPoint {
  date: string; // YYYY-MM-DD
  revenueBaseUsd: number;
  orders: number;
}

export interface PlatformRevenueReport {
  totals: PlatformRevenueTotals;
  byMarket: MarketRevenue[];
  byStatus: StatusRevenue[];
  series: RevenueSeriesPoint[];
}

export interface RevenueRange {
  from: string; // ISO
  to: string; // ISO
  storeId?: string; // optional scope — omit for platform-wide
}

export const commerceRevenueApi = {
  revenue: (range: RevenueRange) =>
    orders.get<ApiResponse<PlatformRevenueReport>>('/orders/analytics/revenue', {
      params: range,
    }),
};
