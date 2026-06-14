package com.baalvion.payment.gateway.spi;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Outcome of verifying and parsing a provider webhook
 * ({@link PaymentGateway#verifyAndParseWebhook}).
 *
 * <p>The adapter performs REAL signature verification (HMAC-SHA256 for
 * Razorpay/Stripe, SHA-512 reverse-hash for PayU) over the RAW request body
 * BEFORE returning. If the signature is invalid the adapter throws; a returned
 * {@code WebhookResult} therefore always represents an authenticated event.
 *
 * <p>{@link #providerEventId()} is the dedup key. It is derived from the SIGNED
 * body (e.g. {@code eventType:entityId}), never from an attacker-settable header,
 * and feeds the {@code UNIQUE(website_slug, provider, provider_event_id)} guarantee
 * on {@code payment_ledger_entries}.
 *
 * @param provider        provider key: {@code razorpay|stripe|payu}
 * @param providerRef     provider-side charge identifier this event pertains to (order/intent/txnid)
 * @param providerEventId stable, body-derived event id used for idempotent dedup
 * @param eventType       native provider event type (e.g. {@code payment.captured})
 * @param status          normalized lifecycle status this event transitions the charge to
 * @param amount          event amount in MINOR units, when present (e.g. refund/capture amount)
 * @param payload         parsed event fields (for ledger persistence / audit)
 */
public record WebhookResult(
  String provider,
  String providerRef,
  String providerEventId,
  String eventType,
  GatewayStatus status,
  BigDecimal amount,
  Map<String, Object> payload
) {

  public WebhookResult {
    // Immutable, order-preserving, NULL-VALUE TOLERANT copy. Providers populate the
    // audit payload from optional event fields (currency, providerOrderId, …) that are
    // frequently absent → null; Map.copyOf() rejects null values and would NPE here.
    payload = payload == null
      ? Map.of()
      : Collections.unmodifiableMap(new LinkedHashMap<>(payload));
  }
}
