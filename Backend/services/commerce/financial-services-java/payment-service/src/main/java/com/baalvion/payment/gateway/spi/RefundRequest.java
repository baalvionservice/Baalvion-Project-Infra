package com.baalvion.payment.gateway.spi;

import java.math.BigDecimal;

/**
 * Provider-agnostic request to refund a captured charge.
 *
 * <p>Mirrors the Node refund flow ({@code razorpay.refund} / {@code stripe.refund});
 * PayU has no in-band refund. A {@code null} {@link #amount()} means a FULL refund;
 * a non-null amount (minor units) is a PARTIAL refund. Idempotency for refunds is
 * enforced by {@code GatewayService} (one refund claim per payment), not the adapter.
 *
 * @param providerRef provider-side charge identifier to refund (order id / payment intent id)
 * @param amount      amount to refund in MINOR units; {@code null} = full refund
 * @param reason      optional human-readable reason forwarded to the provider where supported
 */
public record RefundRequest(
  String providerRef,
  BigDecimal amount,
  String reason
) {}
