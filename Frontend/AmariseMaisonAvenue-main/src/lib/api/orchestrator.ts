/**
 * @fileOverview BAALVION / AMARISE - Production API Orchestrator
 * Replaces the mock orchestrator with real backend calls.
 * Keeps identical function signatures so all existing components continue to work.
 */

import { CountryCode, PaymentGateway, DynamicPrice, RiskLevel } from '../types';
import { inventoryApi, productApi, searchApi, orderApi } from '../api-client';

// Re-export the shared ApiResponse shape so callers don't need to change imports
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  code?: number;
}

// These local types mirror what the mock used to return so nothing downstream changes.
export interface RecommendationNode {
  productId: string;
  name: string;
  score: number;
  reason: string;
  imageUrl?: string;
}

export interface RiskAnalysis {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommendation: 'allow' | 'review' | 'block';
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toApiResponse<T>(result: { ok: true; data: T } | { ok: false; error: { message: string; code?: number } }): ApiResponse<T> {
  if (result.ok) return { status: 'success', data: result.data };
  return {
    status: 'error',
    error: result.error.message,
    code: result.error.code,
  };
}

// ── Orchestrator Class ─────────────────────────────────────────────────────

class ApiOrchestrator {
  // ── Dynamic Pricing ──────────────────────────────────────────────────────
  // Dynamic pricing is computed by commerce-service; fall back gracefully.
  async getDynamicPrice(
    productId: string,
    country: CountryCode,
    _products: unknown[],
    _inquiries: unknown[],
  ): Promise<ApiResponse<DynamicPrice>> {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_COMMERCE_URL || 'http://localhost:3012'}/pricing/dynamic`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, country }),
      },
    ).then(r => r.json()).catch(() => null);

    if (!result) {
      return { status: 'error', error: 'Pricing service unavailable', code: 503 };
    }

    return { status: 'success', data: result as DynamicPrice };
  }

  // ── Fraud / Risk Detection ───────────────────────────────────────────────
  async evaluateFraudRisk(params: {
    userId: string;
    cart: unknown[];
    country: CountryCode;
    metadata: unknown;
  }): Promise<ApiResponse<RiskAnalysis>> {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_ORDER_URL || 'http://localhost:3013'}/risk/evaluate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    ).then(r => r.json()).catch(() => null);

    if (!result) {
      // Fail open — return low-risk so checkout doesn't hard-block on service outage
      return {
        status: 'success',
        data: { score: 0, level: 'low', flags: [], recommendation: 'allow' },
      };
    }

    return { status: 'success', data: result as RiskAnalysis };
  }

  // ── AI Recommendations ───────────────────────────────────────────────────
  async getRecommendations(params: {
    userId: string;
    country: CountryCode;
    history: unknown[];
    cart: unknown[];
    registry: unknown[];
  }): Promise<ApiResponse<RecommendationNode[]>> {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_COMMERCE_URL || 'http://localhost:3012'}/recommendations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    ).then(r => r.json()).catch(() => null);

    if (!result) {
      return { status: 'error', error: 'Recommendation engine unavailable', code: 503 };
    }

    return { status: 'success', data: result as RecommendationNode[] };
  }

  // ── Semantic Search ──────────────────────────────────────────────────────
  async searchProductsSemantic(
    query: string,
    country: string,
    _products: unknown[],
  ): Promise<ApiResponse<unknown>> {
    const result = await searchApi.semantic({ query, country });
    return toApiResponse(result);
  }

  // ── Inventory Locking ────────────────────────────────────────────────────
  async lockInventory(
    variantId: string,
    userId: string,
    quantity = 1,
  ): Promise<ApiResponse<{
    lock_id: string;
    expires_at: string;
    ttl_minutes: number;
  }>> {
    const result = await inventoryApi.lock(variantId, userId, quantity);
    if (!result.ok) {
      return { status: 'error', error: result.error.message, code: result.error.code ?? 409 };
    }
    return {
      status: 'success',
      data: {
        lock_id: result.data.lockId,
        expires_at: result.data.expiresAt,
        ttl_minutes: result.data.ttlMinutes,
      },
    };
  }

  // ── Payment Initiation ───────────────────────────────────────────────────
  async initiatePayment(params: {
    idempotencyKey: string;
    amount: number;
    gateway: PaymentGateway;
  }): Promise<ApiResponse<{
    payment_id: string;
    gateway_ref: string;
    status: string;
  }>> {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_ORDER_URL || 'http://localhost:3013'}/payments/initiate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': params.idempotencyKey,
        },
        body: JSON.stringify(params),
      },
    ).then(r => r.json()).catch(() => null);

    if (!result) {
      return { status: 'error', error: 'Payment service unavailable', code: 503 };
    }

    if (result.error || result.status === 'error') {
      return {
        status: 'error',
        error: result.error || result.message || 'Payment failed',
        code: result.code ?? 400,
      };
    }

    return { status: 'success', data: result };
  }
}

export const apiOrchestrator = new ApiOrchestrator();
