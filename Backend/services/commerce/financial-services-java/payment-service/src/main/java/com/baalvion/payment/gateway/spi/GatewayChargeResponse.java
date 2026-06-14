package com.baalvion.payment.gateway.spi;

import java.util.Map;

/**
 * Result of a {@link PaymentGateway#initiate} / {@link PaymentGateway#capture} /
 * {@link PaymentGateway#fetchStatus} call.
 *
 * <p>Mirrors the Node adapter return shape:
 * {@code {providerOrderId, clientParams, ...}}. {@code clientParams} are the
 * non-secret values the browser SDK needs to complete checkout (Razorpay
 * {@code key/orderId}, Stripe {@code clientSecret/publishableKey}, PayU
 * {@code txnid/hash}). Secrets never appear here.
 *
 * @param provider      provider key: {@code razorpay|stripe|payu}
 * @param providerRef   provider-side identifier (order id / payment intent id / txnid)
 * @param status        normalized lifecycle status
 * @param clientParams  non-secret values handed to the client SDK to finish checkout
 * @param rawResponse   raw provider response payload (persisted to {@code raw_response} for audit)
 */
public record GatewayChargeResponse(
  String provider,
  String providerRef,
  GatewayStatus status,
  Map<String, String> clientParams,
  String rawResponse
) {

  public GatewayChargeResponse {
    clientParams = clientParams == null ? Map.of() : Map.copyOf(clientParams);
  }
}
