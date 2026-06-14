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
 *   <li>Secrets are resolved per call from the passed {@link ProviderConfig}, never read
 *       ad-hoc. {@code GatewayService} → {@code PspConfigResolver} builds it either from the
 *       global {@code app.psp.*} env (single-tenant back-compat) or from the per-tenant CMS
 *       "Integrations &amp; Keys" vault (keyed by website slug) — the adapter is agnostic to
 *       which.</li>
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
   *
   * @param request the provider-agnostic charge request (amount in MINOR units)
   * @param config  resolved per-call credentials/options (global env or per-tenant CMS vault)
   */
  GatewayChargeResponse initiate(GatewayChargeRequest request, ProviderConfig config);

  /**
   * Capture a previously authorized charge. For providers that auto-capture
   * (the Node default for all three), implementations may treat this as a status
   * confirmation rather than an explicit capture call.
   *
   * @param providerRef provider-side charge identifier (order/intent id)
   * @param config      resolved per-call credentials/options (global env or per-tenant CMS vault)
   */
  GatewayChargeResponse capture(String providerRef, ProviderConfig config);

  /**
   * Refund a captured charge, fully or partially (see {@link RefundRequest#amount()}).
   *
   * @param request the refund request ({@code null} amount = full refund)
   * @param config  resolved per-call credentials/options (global env or per-tenant CMS vault)
   */
  RefundResult refund(RefundRequest request, ProviderConfig config);

  /**
   * Fetch the current status of a charge from the provider (or last-known state).
   *
   * @param providerRef provider-side charge identifier (order/intent id)
   * @param config      resolved per-call credentials/options (global env or per-tenant CMS vault)
   */
  GatewayChargeResponse fetchStatus(String providerRef, ProviderConfig config);

  /**
   * Verify the provider's webhook signature over the RAW request body, then parse it.
   *
   * <p>Implementations MUST verify the signature with constant-time comparison
   * before parsing and MUST throw if verification fails — callers rely on a returned
   * {@link WebhookResult} being authenticated. The webhook secret comes from {@code config}.
   *
   * @param rawBody raw, unmodified UTF-8 request body bytes-as-received (do not re-serialize)
   * @param headers case-insensitive view of inbound HTTP headers (signature, timestamp, etc.)
   * @param config  resolved per-call credentials/options (carries the webhook secret)
   * @return the verified, parsed event
   * @throws com.baalvion.payment.gateway.exception.WebhookVerificationException if the signature is invalid or stale
   */
  WebhookResult verifyAndParseWebhook(byte[] rawBody, Map<String, String> headers, ProviderConfig config);
}
