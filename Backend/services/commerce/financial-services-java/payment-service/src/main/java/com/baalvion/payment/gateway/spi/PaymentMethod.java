package com.baalvion.payment.gateway.spi;

/**
 * Customer-facing payment instrument selected at checkout.
 *
 * <p>Mirrors the {@code method} field on the Node gateway-checkout contract
 * (POST /v1/gateway/payments). The provider adapter returns a generic order/intent;
 * the concrete instrument is resolved client-side, so this is advisory metadata
 * persisted on {@code payments.gateway_payments.method}.
 */
public enum PaymentMethod {
  CARD,
  BANK,
  UPI,
  NETBANKING
}
