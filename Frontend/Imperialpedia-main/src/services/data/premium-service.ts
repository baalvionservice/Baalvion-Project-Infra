import { ApiResponse, SubscriptionTier, PremiumState } from '@/types/premium';
import { errorHandler } from '@/lib/errors/error-handler';
import { apiClient } from '@/services/api-client/client';
import { TIER_PRESENTATION, DEFAULT_TIER_PRESENTATION } from '@/services/data/premium-plans-presentation';

/**
 * @fileOverview Abstraction layer for subscription and billing data.
 *
 * This file previously carried getReports/getAnalytics/getDashboardData/
 * getPortfolioDeepDive/getBacktestData — all backed entirely by
 * `@/services/mock-api/premium` fabricated data, and all confirmed to have zero
 * real consumers (the /premium/analytics, /premium/reports, /premium/dashboard,
 * /premium/deep-dive, /premium/backtesting pages already render FeatureUnavailable
 * unconditionally, per their own doc comments). Removed as unreachable dead code.
 */

interface PlanApiRow {
  tierKey: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
}

// USD is the only currency plans.currency has ever been seeded with; extend this map
// if/when a non-USD plan is added rather than falling back to the raw currency code.
const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$' };

function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${symbol}${formatted}`;
}

function toSubscriptionTier(row: PlanApiRow): SubscriptionTier {
  const presentation = TIER_PRESENTATION[row.tierKey] || DEFAULT_TIER_PRESENTATION;
  return {
    id: row.tierKey,
    name: row.name,
    plan_name: row.name,
    priceMonthly: formatPrice(row.monthlyPrice, row.currency),
    price: row.monthlyPrice,
    priceYearly: formatPrice(row.annualPrice, row.currency),
    ...presentation,
  };
}

export const premiumService = {
  // Real, server-authoritative pricing (GET /payments/plans reads the same `plans` rows
  // POST /payments/checkout charges from) -- see Backend/.../imperialpedia-service
  // controller/paymentsController.js listPlans. Only description/features/color are
  // static (see premium-plans-presentation.ts); price/name can never drift from what a
  // customer is actually charged.
  async getTiers(): Promise<ApiResponse<SubscriptionTier[]>> {
    try {
      const res = await apiClient.get<{ success: boolean; data: PlanApiRow[] }>('/payments/plans');
      return { data: res.data.data.map(toSubscriptionTier), status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getPremiumState(): Promise<ApiResponse<PremiumState | null>> {
    try {
      const [tiersRes, subRes] = await Promise.all([
        this.getTiers(),
        apiClient
          .get<{ success: boolean; data: { activeTier: string | null } }>('/payments/subscription')
          .then((r) => r.data.data)
          // Anonymous visitors (no session) or a transient error both mean "no known active
          // tier" -- never fabricate one, same rule as the old mock's activeTier: null fix.
          .catch(() => ({ activeTier: null as string | null })),
      ]);
      if (tiersRes.error || !tiersRes.data.length) {
        return { data: null, status: tiersRes.status, error: tiersRes.error };
      }
      return {
        data: {
          tiers: tiersRes.data,
          activeTier: subRes.activeTier,
          trialInfo: { available: true, durationDays: 14 },
        },
        status: 200,
      };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  }
};
