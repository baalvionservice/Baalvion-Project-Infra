package com.baalvion.payment.gateway.spi;

import java.util.Map;

/**
 * Service Provider Interface (strategy pattern) for an external PSP gateway —
 * Razorpay, Stripe, or PayU.
 *
 * <p>This is the Java port of the Node {@code gateway/adapters/*.js} contract
 * ({@code {name, createOrder, verifyWebhook, parseWebhook, refund}}). Each
 * implementation is a {@code @Component} registered under {@link #name()} in the
 * {@code GatewayRegistry}; {@code GatewayService} selects one per request by the
 * {@code provider} field and never talks to a provider directly.
 *
 * <p>Contract notes carried over from the Node spec:
 * <ul>
 *   <li>Signature verification is REAL crypto in both live and mock modes;
 *       mock only affects deterministic create/refund ids.</li>
 *   <li>Secrets are resolved from configuration ({@code PspProperties}), never read ad-hoc.</li>
 *   <li>Amounts cross this boundary in MINOR units (paise/cents) as the providers expect.</li>
 * </ul>
 */
public interface PaymentGateway {

  /**
   * Provider key this adapter handles: {@code razorpay}, {@code stripe}, or {@code payu}.
   * Used as the {@code GatewayRegistry} map key and persisted on the entity.
   */
  String name();

  /**
   * Initiate a charge: create the provider order/intent and return the client params
   * needed to complete checkout.
   */
  GatewayChargeResponse initiate(GatewayChargeRequest request);

  /**
   * Capture a previously authorized charge. For providers that auto-capture
   * (the Node default for all three), implementations may treat this as a status
   * confirmation rather than an explicit capture call.
   *
   * @param providerRef provider-side charge identifier (order/intent id)
   */
  GatewayChargeResponse capture(String providerRef);

  /**
   * Refund a captured charge, fully or partially (see {@link RefundRequest#amount()}).
   */
  RefundResult refund(RefundRequest request);

  /**
   * Fetch the current status of a charge from the provider (or last-known state).
   *
   * @param providerRef provider-side charge identifier (order/intent id)
   */
  GatewayChargeResponse fetchStatus(String providerRef);

  /**
   * Verify the provider's webhook signature over the RAW request body, then parse it.
   *
   * <p>Implementations MUST verify the signature with constant-time comparison
   * before parsing and MUST throw if verification fails — callers rely on a returned
   * {@link WebhookResult} being authenticated.
   *
   * @param rawBody raw, unmodified UTF-8 request body bytes-as-received (do not re-serialize)
   * @param headers case-insensitive view of inbound HTTP headers (signature, timestamp, etc.)
   * @return the verified, parsed event
   * @throws com.baalvion.payment.gateway.exception.WebhookVerificationException if the signature is invalid or stale
   */
  WebhookResult verifyAndParseWebhook(byte[] rawBody, Map<String, String> headers);
}
