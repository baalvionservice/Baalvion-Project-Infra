/**
 * @fileOverview BAALVION / AMARISE — API Orchestrator.
 *
 * Signatures are preserved so existing components keep compiling, but every call to a
 * NON-EXISTENT backend endpoint has been REMOVED (no phantom fetches, no fakes). Each
 * such capability now returns an explicit NOT_IMPLEMENTED error (code 501). Verified gaps:
 *   - dynamic pricing      → commerce-service has no /pricing/dynamic
 *   - fraud/risk           → order-service has no /risk/evaluate
 *   - recommendations      → commerce-service has no /recommendations
 *   - semantic search      → no search service (routes via searchApi → NOT_IMPLEMENTED)
 *   - inventory lock        → inventory-service has no lock API (routes via inventoryApi)
 *   - payment initiation   → order-service exposes order-scoped recordPayment, NOT /payments/initiate
 */

import { CountryCode, PaymentGateway, DynamicPrice } from '../types';
import { inventoryApi, searchApi, ApiResult } from '../api-client';

// Re-export the shared ApiResponse shape so callers don't need to change imports
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  code?: number;
}

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

function toApiResponse<T>(result: ApiResult<T>): ApiResponse<T> {
  if (result.ok) return { status: 'success', data: result.data };
  return { status: 'error', error: result.error.message, code: result.error.code };
}

function notImplemented<T>(feature: string): ApiResponse<T> {
  return { status: 'error', error: `NOT_IMPLEMENTED: ${feature} has no backend endpoint`, code: 501 };
}

// ── Orchestrator Class ─────────────────────────────────────────────────────

class ApiOrchestrator {
  // Dynamic pricing — no backend endpoint. Caller should fall back to product.basePrice.
  async getDynamicPrice(
    _productId: string,
    _country: CountryCode,
    _products: unknown[],
    _inquiries: unknown[],
  ): Promise<ApiResponse<DynamicPrice>> {
    return notImplemented<DynamicPrice>('dynamic pricing');
  }

  // Fraud/risk — no backend endpoint. NOT faked to "low/allow" (that would hide the gap).
  // Checkout's behaviour on this 501 (fail-open vs block) is an unresolved product decision.
  async evaluateFraudRisk(_params: {
    userId: string;
    cart: unknown[];
    country: CountryCode;
    metadata: unknown;
  }): Promise<ApiResponse<RiskAnalysis>> {
    return notImplemented<RiskAnalysis>('fraud/risk evaluation');
  }

  // AI recommendations — no backend endpoint.
  async getRecommendations(_params: {
    userId: string;
    country: CountryCode;
    history: unknown[];
    cart: unknown[];
    registry: unknown[];
  }): Promise<ApiResponse<RecommendationNode[]>> {
    return notImplemented<RecommendationNode[]>('product recommendations');
  }

  // Semantic search — routes through searchApi, which is NOT_IMPLEMENTED.
  async searchProductsSemantic(
    query: string,
    country: string,
    _products: unknown[],
  ): Promise<ApiResponse<unknown>> {
    return toApiResponse(await searchApi.semantic({ query, country }));
  }

  // Inventory locking — routes through inventoryApi, which is NOT_IMPLEMENTED.
  async lockInventory(
    variantId: string,
    userId: string,
    quantity = 1,
  ): Promise<ApiResponse<{ lock_id: string; expires_at: string; ttl_minutes: number }>> {
    const result = await inventoryApi.lock(variantId, userId, quantity);
    if (!result.ok) return { status: 'error', error: result.error.message, code: result.error.code ?? 501 };
    return {
      status: 'success',
      data: { lock_id: result.data.lockId, expires_at: result.data.expiresAt, ttl_minutes: result.data.ttlMinutes },
    };
  }

  // Payment initiation — no flat /payments/initiate. Backend records payments per-order at
  // /orders/stores/:storeId/orders/:orderId/payments (post-order). Pre-order initiation is unbacked.
  async initiatePayment(_params: {
    idempotencyKey: string;
    amount: number;
    gateway: PaymentGateway;
  }): Promise<ApiResponse<{ payment_id: string; gateway_ref: string; status: string }>> {
    return notImplemented<{ payment_id: string; gateway_ref: string; status: string }>(
      'pre-order payment initiation (use order-scoped recordPayment instead)',
    );
  }
}

export const apiOrchestrator = new ApiOrchestrator();
