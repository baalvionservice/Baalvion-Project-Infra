package com.baalvion.payment.gateway.spi;

/**
 * Canonical PSP charge lifecycle, normalized across Razorpay / Stripe / PayU.
 *
 * <p>Mirrors the Node {@code base.js} canonical status set
 * ({@code 'created'|'authorized'|'captured'|'failed'|'refunded'}). Each provider adapter
 * maps its native webhook event types onto exactly one of these values via
 * {@link PaymentGateway#verifyAndParseWebhook}.
 */
public enum GatewayStatus {
  /** Order/intent created at the provider; awaiting customer action. */
  CREATED,
  /** Funds authorized (held) but not yet captured. */
  AUTHORIZED,
  /** Funds captured/settled — terminal success. */
  CAPTURED,
  /** Charge failed — terminal failure. */
  FAILED,
  /** Captured charge fully or partially refunded. */
  REFUNDED
}
