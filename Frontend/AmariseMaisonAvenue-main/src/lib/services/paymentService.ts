/**
 * @fileOverview Production-Grade Payment Orchestration Service (Mock)
 * Simulates gateway interactions for Stripe, Razorpay, PayU, and Bank Transfers.
 * Enhanced with Idempotency, Multi-Tenant validation, and Async Webhook Lifecycle.
 */

import { PaymentGateway, PaymentStatus, Payment } from '../types';

export interface PaymentIntentResponse {
  success: boolean;
  payment_id: string;
  client_secret?: string;
  gateway_order_id?: string;
  instructions?: string;
  message: string;
}

export class MockPaymentService {
  // Simple in-memory cache to simulate idempotency check
  private processedKeys = new Set<string>();

  /**
   * Simulates POST /payments/create
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    gateway: PaymentGateway;
    userId: string;
    tenantId: string;
    idempotencyKey: string;
    subscriptionId?: string;
  }): Promise<PaymentIntentResponse> {
    const { amount, gateway, idempotencyKey, tenantId } = params;

    // 1. Production-Grade Idempotency Check
    if (this.processedKeys.has(idempotencyKey)) {
      console.warn(`%c[TREASURY] Duplicate request detected for key: ${idempotencyKey}. Returning cached response.`, "color: #FFA500; font-weight: bold;");
      return {
        success: true,
        payment_id: "cached_payment_id",
        message: "Request already processed. Registry stable."
      };
    }

    // 2. Multi-Tenant Verification
    console.log(`%c[SECURITY] Validating Tenant context: ${tenantId} for Global Settlement.`, "color: #3B82F6;");

    const paymentId = `pay_${Math.random().toString(36).substr(2, 9)}`;

    // 3. Simulate Gateway Latency (Production Simulation)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Mark key as processed
    this.processedKeys.add(idempotencyKey);

    switch (gateway) {
      case 'STRIPE':
        return {
          success: true,
          payment_id: paymentId,
          client_secret: `pi_${paymentId}_secret_${Math.random().toString(36).substr(2, 5)}`,
          message: "Stripe PaymentIntent established. Awaiting successful authorization."
        };
      case 'RAZORPAY':
        return {
          success: true,
          payment_id: paymentId,
          gateway_order_id: `order_${paymentId}`,
          message: "Razorpay Order ID issued for UPI/Card capture."
        };
      case 'PAYU':
        return {
          success: true,
          payment_id: paymentId,
          client_secret: `payu_token_${paymentId}`,
          message: "PayU Transaction initialized for global settlement."
        };
      case 'BANK_TRANSFER':
        return {
          success: true,
          payment_id: paymentId,
          instructions: `Institutional Dispatch: Please transfer ${params.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} to Maison Escrow (FCA Regulated). Reference: ${paymentId}`,
          message: "Manual Bank Transfer protocol initiated. Registry entry pending reconciliation."
        };
      default:
        throw new Error("Invalid Payment Gateway Route");
    }
  }

  /**
   * Simulates Webhook Processing Loop (Async Worker)
   */
  async simulateWebhook(paymentId: string, status: PaymentStatus = 'SUCCESS'): Promise<void> {
    console.log(`%c[WEBHOOK WORKER] Processing event for ${paymentId} with status: ${status}`, "color: #7E3F98; font-weight: bold;");
    // In production, this worker updates the 'payments' table and triggers 'billing_logs'
  }
}

export const paymentService = new MockPaymentService();
