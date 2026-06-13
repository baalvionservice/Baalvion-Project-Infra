package com.baalvion.payment.gateway.spi;

import java.math.BigDecimal;

/**
 * Result of a {@link PaymentGateway#refund} call.
 *
 * <p>Mirrors the Node adapter return shape {@code {providerRefundId, status:'refunded'}}.
 *
 * @param provider         provider key: {@code razorpay|stripe|payu}
 * @param providerRefundId provider-side refund identifier
 * @param status           normalized status (typically {@link GatewayStatus#REFUNDED})
 * @param amount           amount refunded in MINOR units
 * @param rawResponse      raw provider response payload (persisted for audit)
 */
public record RefundResult(
  String provider,
  String providerRefundId,
  GatewayStatus status,
  BigDecimal amount,
  String rawResponse
) {}
