import { serviceClients } from './client';
import type { ApiResponse } from '@/lib/types/common.types';

const orders = serviceClients.orders;
const inventory = serviceClients.inventory;

// ─── Response shapes (analytics money values are in CURRENCY UNITS, not minor) ──

export interface AnalyticsSummary {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

// GET /by-country returns an object map { [country]: revenue }
export type CountryRevenueMap = Record<string, number>;

export interface RevenuePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export type RevenueGranularity = 'day' | 'week' | 'month';

// Reconciliation totals are in MINOR units (cents) — divide by 100 for display.
export interface Reconciliation {
  ledgerAvailable: boolean;
  balanced: boolean;
  counts: {
    expected: number;
    matched: number;
    missing: number;
    mismatched: number;
  };
  totals: {
    capturedMinor: number;
    refundedMinor: number;
    netMinor: number;
  };
}

// Inventory low-stock (PAGINATED envelope: r.data = { success, data:[...], pagination, summary })
export interface LowStockItem {
  id: string;
  sku: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  status: string;
  warehouse: { id: string; name: string; code: string };
}

export interface LowStockSummary {
  lowStock: number;
  outOfStock: number;
  total: number;
}

export interface LowStockResponse {
  success: boolean;
  data: LowStockItem[];
  pagination?: unknown;
  summary: LowStockSummary;
}

export interface AnalyticsRange {
  from: string; // ISO
  to: string; // ISO
}

export const commerceAnalyticsApi = {
  summary: (storeId: string, range: AnalyticsRange) =>
    orders.get<ApiResponse<AnalyticsSummary>>(
      `/orders/stores/${storeId}/analytics/summary`,
      { params: range },
    ),

  topProducts: (storeId: string, range: AnalyticsRange, limit = 10) =>
    orders.get<ApiResponse<TopProduct[]>>(
      `/orders/stores/${storeId}/analytics/top-products`,
      { params: { ...range, limit } },
    ),

  byCountry: (storeId: string, range: AnalyticsRange) =>
    orders.get<ApiResponse<CountryRevenueMap>>(
      `/orders/stores/${storeId}/analytics/by-country`,
      { params: range },
    ),

  revenue: (storeId: string, range: AnalyticsRange, granularity: RevenueGranularity = 'day') =>
    orders.get<ApiResponse<RevenuePoint[]>>(
      `/orders/stores/${storeId}/analytics/revenue`,
      { params: { ...range, granularity } },
    ),

  reconciliation: (storeId: string, range: AnalyticsRange) =>
    orders.get<ApiResponse<Reconciliation>>(
      `/orders/stores/${storeId}/reconciliation`,
      { params: range },
    ),

  lowStock: (storeId: string, limit = 10) =>
    inventory.get<LowStockResponse>(
      `/inventory/stores/${storeId}/alerts/low-stock`,
      { params: { limit } },
    ),
};
