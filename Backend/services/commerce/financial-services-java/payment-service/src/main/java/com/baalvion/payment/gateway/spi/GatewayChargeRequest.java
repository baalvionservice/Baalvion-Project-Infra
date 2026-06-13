package com.baalvion.payment.gateway.spi;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Provider-agnostic request to initiate a PSP charge (create an order/intent).
 *
 * <p>Built by {@code GatewayService} from the inbound
 * {@code POST /v1/gateway/payments} body and handed to the selected
 * {@link PaymentGateway#initiate}. The adapter translates this into the provider's
 * native create-order/create-intent call (Razorpay orders, Stripe PaymentIntents,
 * PayU redirect hash) — the per-provider HTTP body is filled in by later agents.
 *
 * @param provider       provider key: {@code razorpay|stripe|payu}
 * @param amount         charge amount in MINOR units (e.g. paise/cents) as a whole number
 * @param currency       ISO-4217 currency code (3 chars, e.g. {@code INR})
 * @param method         customer-selected instrument (advisory; client resolves the concrete one)
 * @param orderRef       merchant order reference / receipt to echo back to the provider
 * @param idempotencyKey caller-supplied Idempotency-Key header; deduplicates create calls
 * @param customer       customer fields (name, email, contact) required by some providers (e.g. PayU hash)
 * @param metadata       opaque key/value pairs persisted and/or forwarded as provider notes
 */
public record GatewayChargeRequest(
  String provider,
  BigDecimal amount,
  String currency,
  PaymentMethod method,
  String orderRef,
  String idempotencyKey,
  Map<String, String> customer,
  Map<String, String> metadata
) {

  public GatewayChargeRequest {
    customer = customer == null ? Map.of() : Map.copyOf(customer);
    metadata = metadata == null ? Map.of() : Map.copyOf(metadata);
  }
}
