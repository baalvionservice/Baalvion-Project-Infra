package com.baalvion.payment.gateway.spi;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Resolved per-call PSP provider configuration handed to a {@link PaymentGateway}.
 *
 * <p>This is the seam that makes the gateway adapters MULTI-TENANT. Today's global path
 * reads keys from {@code app.psp.<provider>} (one key set per provider); the tenant path
 * resolves keys PER website slug from the CMS "Integrations &amp; Keys" vault — exactly as the
 * deleted Node payment-service did. Either way the adapter receives the same shape and never
 * reads secrets ad-hoc: {@code GatewayService} → {@code PspConfigResolver} builds one of these
 * and passes it into every SPI method.
 *
 * <p>{@code secrets} carries the provider credentials under the SAME names the adapters already
 * expect (Razorpay {@code keyId}/{@code keySecret}/{@code webhookSecret}; Stripe
 * {@code secretKey}/{@code publishableKey}/{@code webhookSecret}; PayU {@code merchantKey}/
 * {@code merchantSalt}). {@code config} carries non-secret options (e.g. {@code baseUrl},
 * {@code mode}). {@code mock} mirrors the Node {@code mode !== 'live'} branch: live tenants set
 * it false, everything else stays deterministic-mock.
 *
 * @param provider provider key: {@code razorpay|stripe|payu}
 * @param mock     when true, adapters generate deterministic create/refund ids (no live call)
 * @param secrets  provider credentials keyed by the adapter's expected names (never logged)
 * @param config   non-secret provider options (baseUrl, mode, …)
 */
public record ProviderConfig(
  String provider,
  boolean mock,
  Map<String, String> secrets,
  Map<String, Object> config
) {

  public ProviderConfig {
    // Immutable, order-preserving, NULL-VALUE TOLERANT copies (same rationale as WebhookResult):
    // the CMS vault frequently omits optional secret/config fields → null values that
    // Map.copyOf() would reject with an NPE.
    secrets = secrets == null
      ? Map.of()
      : Collections.unmodifiableMap(new LinkedHashMap<>(secrets));
    config = config == null
      ? Map.of()
      : Collections.unmodifiableMap(new LinkedHashMap<>(config));
  }

  /** Secret value for {@code key} (e.g. {@code keyId}), or {@code null} if absent/unset. */
  public String secret(String key) {
    return key == null ? null : secrets.get(key);
  }

  /** Non-secret config value for {@code key} as a String, or {@code null} if absent/non-string. */
  public String configString(String key) {
    if (key == null) {
      return null;
    }
    Object value = config.get(key);
    return (value instanceof String s) ? s : null;
  }

  /** {@code config.baseUrl} when it is a non-blank String, else {@code def}. */
  public String baseUrlOr(String def) {
    String baseUrl = configString("baseUrl");
    return (baseUrl == null || baseUrl.isBlank()) ? def : baseUrl;
  }
}
