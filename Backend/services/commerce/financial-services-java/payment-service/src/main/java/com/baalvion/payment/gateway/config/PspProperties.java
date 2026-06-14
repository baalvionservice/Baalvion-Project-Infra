package com.baalvion.payment.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;
import org.springframework.stereotype.Component;

/**
 * Externalized PSP credentials and endpoints, bound from the {@code app.psp.*} namespace.
 *
 * <p>Mirrors the Node provider secrets (resolved there from the CMS vault via
 * {@code sdk.config}). In this service they bind from environment variables at deploy time
 * — secrets are NEVER hardcoded. Each provider's {@code base-url} defaults to its public
 * API host; {@code mock} flips deterministic create/refund id generation on for non-prod.
 *
 * <p>Example (application.yml):
 * <pre>
 * app:
 *   psp:
 *     razorpay:
 *       key-id: ${RAZORPAY_KEY_ID:}
 *       key-secret: ${RAZORPAY_KEY_SECRET:}
 *       webhook-secret: ${RAZORPAY_WEBHOOK_SECRET:}
 *       base-url: ${RAZORPAY_BASE_URL:https://api.razorpay.com}
 *     stripe:
 *       secret-key: ${STRIPE_SECRET_KEY:}
 *       publishable-key: ${STRIPE_PUBLISHABLE_KEY:}
 *       webhook-secret: ${STRIPE_WEBHOOK_SECRET:}
 *       base-url: ${STRIPE_BASE_URL:https://api.stripe.com}
 *     payu:
 *       merchant-key: ${PAYU_MERCHANT_KEY:}
 *       merchant-salt: ${PAYU_MERCHANT_SALT:}
 *       base-url: ${PAYU_BASE_URL:https://secure.payu.in}
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "app.psp")
@Data
public class PspProperties {

  /** When true, providers generate deterministic mock order/refund ids (no live merchant call). */
  private boolean mock = false;

  @NestedConfigurationProperty
  private Razorpay razorpay = new Razorpay();

  @NestedConfigurationProperty
  private Stripe stripe = new Stripe();

  @NestedConfigurationProperty
  private Payu payu = new Payu();

  /** Razorpay: HTTP Basic auth (keyId:keySecret), HMAC-SHA256 webhook signature. */
  @Data
  public static class Razorpay {
    private String keyId;
    private String keySecret;
    private String webhookSecret;
    private String baseUrl = "https://api.razorpay.com";
    /** Replay window for the webhook {@code created_at} field, in seconds (Node: 600). */
    private long replayWindowSeconds = 600;
  }

  /** Stripe: Bearer {secretKey}, HMAC-SHA256 over {@code {t}.{rawBody}} webhook signature. */
  @Data
  public static class Stripe {
    private String secretKey;
    private String publishableKey;
    private String webhookSecret;
    private String baseUrl = "https://api.stripe.com";
    /** Signature tolerance window in seconds (Node: 300). */
    private long toleranceSeconds = 300;
  }

  /** PayU: redirect/post flow, SHA-512 reverse-hash webhook verification (no API call). */
  @Data
  public static class Payu {
    private String merchantKey;
    private String merchantSalt;
    private String baseUrl = "https://secure.payu.in";
  }
}
