package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.config.CmsIntegrationsClient;
import com.baalvion.payment.gateway.config.PspProperties;
import com.baalvion.payment.gateway.exception.PspConfigNotFoundException;
import com.baalvion.payment.gateway.spi.ProviderConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resolves the {@link ProviderConfig} for a charge: the seam that makes the gateway MULTI-TENANT.
 *
 * <ul>
 *   <li><b>GLOBAL mode</b> (null/blank {@code siteSlug}) — the existing single-tenant behavior:
 *       credentials come from the global {@code app.psp.<provider>} env ({@link PspProperties}),
 *       {@code mock = app.psp.mock}. Keeps env-key deployments working unchanged.</li>
 *   <li><b>CMS mode</b> (non-blank {@code siteSlug}) — credentials come from the per-tenant CMS
 *       "Integrations &amp; Keys" vault. Replicates the deleted Node SDK: the active payment
 *       integration is the first entry where {@code category=="payment" && enabled &&
 *       status=="configured"}; a per-provider lookup matches {@code provider==<name>}. {@code mock}
 *       is {@code config.mode != "live"}. A tenant with no matching enabled/configured provider
 *       raises {@link PspConfigNotFoundException} (HTTP 422).</li>
 * </ul>
 *
 * <p>CMS lookups are cached in-process for 60s per slug (a plain {@link ConcurrentHashMap} with
 * timestamps — no extra deps), bounding load on the CMS while keeping key rotation reasonably
 * fresh. Secrets are never logged.
 */
@Slf4j
@Component
public class PspConfigResolver {

  private static final long CACHE_TTL_MS = 60_000L;
  private static final String CATEGORY_PAYMENT = "payment";
  private static final String STATUS_CONFIGURED = "configured";
  private static final String MODE_LIVE = "live";

  private final PspProperties pspProperties;
  private final CmsIntegrationsClient cmsClient;
  private final boolean globalFallbackEnabled;
  private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

  public PspConfigResolver(PspProperties pspProperties, CmsIntegrationsClient cmsClient,
                           @Value("${app.psp.global-fallback-enabled:true}") boolean globalFallbackEnabled) {
    this.pspProperties = pspProperties;
    this.cmsClient = cmsClient;
    this.globalFallbackEnabled = globalFallbackEnabled;
  }

  /**
   * Resolve the per-call config for {@code provider} under {@code siteSlug}.
   *
   * @param siteSlug tenant website slug; {@code null}/blank → GLOBAL (env-key) mode
   * @param provider provider key ({@code razorpay|stripe|payu}); case-insensitive
   * @return the resolved {@link ProviderConfig}
   * @throws PspConfigNotFoundException if a tenant has no enabled/configured matching provider
   */
  public ProviderConfig resolve(String siteSlug, String provider) {
    String normalizedProvider = provider == null ? "" : provider.toLowerCase(Locale.ROOT);
    if (siteSlug == null || siteSlug.isBlank()) {
      return globalConfig(normalizedProvider);
    }
    return cmsConfig(siteSlug, normalizedProvider);
  }

  // ---------------------------------------------------------------- GLOBAL (env) mode

  /** Build the config from the global {@code app.psp.<provider>} env — the existing behavior. */
  private ProviderConfig globalConfig(String provider) {
    boolean mock = pspProperties.isMock();
    Map<String, String> secrets = new LinkedHashMap<>();
    Map<String, Object> config = new LinkedHashMap<>();
    config.put("mode", mock ? "test" : MODE_LIVE);

    switch (provider) {
      case "razorpay" -> {
        PspProperties.Razorpay r = pspProperties.getRazorpay();
        secrets.put("keyId", r.getKeyId());
        secrets.put("keySecret", r.getKeySecret());
        secrets.put("webhookSecret", r.getWebhookSecret());
        config.put("baseUrl", r.getBaseUrl());
      }
      case "stripe" -> {
        PspProperties.Stripe s = pspProperties.getStripe();
        secrets.put("secretKey", s.getSecretKey());
        secrets.put("publishableKey", s.getPublishableKey());
        secrets.put("webhookSecret", s.getWebhookSecret());
        config.put("baseUrl", s.getBaseUrl());
      }
      case "payu" -> {
        PspProperties.Payu p = pspProperties.getPayu();
        secrets.put("merchantKey", p.getMerchantKey());
        secrets.put("merchantSalt", p.getMerchantSalt());
        config.put("baseUrl", p.getBaseUrl());
      }
      default -> throw new IllegalArgumentException("Unsupported payment provider: " + provider);
    }
    return new ProviderConfig(provider, mock, secrets, config);
  }

  // ---------------------------------------------------------------- CMS (per-tenant) mode

  /** Build the config from the CMS vault entry for {@code slug} + {@code provider}. */
  private ProviderConfig cmsConfig(String slug, String provider) {
    Map<String, Object> entry = findProviderEntry(integrations(slug), provider);
    if (entry == null) {
      // No per-tenant override in the CMS vault. Fall back to the GLOBAL/default credentials
      // (app.psp.<provider> env) when they are present, so a site without bespoke keys still
      // transacts on the platform default account — which in a sandbox/test deploy is the
      // test merchant (PSP_MOCK + rzp_test_*). This realizes the "global defaults + tenant
      // overrides, sandbox fallback" contract. Disable with app.psp.global-fallback-enabled=false
      // to instead fail hard (422) for any tenant lacking its own configured provider.
      if (globalFallbackEnabled && hasGlobalKeys(provider)) {
        log.warn("No CMS payment config for site={} provider={} — falling back to GLOBAL default credentials (mock={})",
          slug, provider, pspProperties.isMock());
        return globalConfig(provider);
      }
      throw new PspConfigNotFoundException(provider, slug);
    }

    Map<String, String> secrets = stringMap(entry.get("secrets"));
    Map<String, Object> config = objectMap(entry.get("config"));
    boolean mock = !MODE_LIVE.equals(config.get("mode"));
    return new ProviderConfig(provider, mock, secrets, config);
  }

  /** Whether the global env config carries a usable primary key for {@code provider}. */
  private boolean hasGlobalKeys(String provider) {
    String key = switch (provider) {
      case "razorpay" -> pspProperties.getRazorpay().getKeyId();
      case "stripe" -> pspProperties.getStripe().getSecretKey();
      case "payu" -> pspProperties.getPayu().getMerchantKey();
      default -> null;
    };
    return key != null && !key.isBlank();
  }

  /**
   * Per-provider lookup: first entry whose {@code provider} matches AND is enabled/configured for
   * payments. Mirrors the Node contract — the active payment provider is the first
   * {@code category=="payment" && enabled && status=="configured"} entry; the per-provider lookup
   * additionally constrains the provider name (used for webhook-secret resolution too).
   */
  private static Map<String, Object> findProviderEntry(List<Map<String, Object>> integrations, String provider) {
    for (Map<String, Object> entry : integrations) {
      if (!provider.equals(asLower(entry.get("provider")))) {
        continue;
      }
      if (!CATEGORY_PAYMENT.equals(asLower(entry.get("category")))) {
        continue;
      }
      if (!Boolean.TRUE.equals(entry.get("enabled"))) {
        continue;
      }
      if (!STATUS_CONFIGURED.equals(asLower(entry.get("status")))) {
        continue;
      }
      return entry;
    }
    return null;
  }

  // ---------------------------------------------------------------- 60s TTL cache

  private List<Map<String, Object>> integrations(String slug) {
    long now = System.currentTimeMillis();
    CacheEntry cached = cache.get(slug);
    if (cached != null && (now - cached.fetchedAtMs()) < CACHE_TTL_MS) {
      return cached.integrations();
    }
    List<Map<String, Object>> fresh = cmsClient.fetchIntegrations(slug);
    cache.put(slug, new CacheEntry(fresh, now));
    return fresh;
  }

  private record CacheEntry(List<Map<String, Object>> integrations, long fetchedAtMs) {}

  // ---------------------------------------------------------------- coercion helpers

  /** Coerce a value to a lower-cased String, or {@code null} when absent/non-string. */
  private static String asLower(Object value) {
    return (value instanceof String s) ? s.toLowerCase(Locale.ROOT) : null;
  }

  /** Coerce a JSON object value into a {@code Map<String,String>} (non-string values → toString). */
  @SuppressWarnings("unchecked")
  private static Map<String, String> stringMap(Object value) {
    Map<String, String> out = new LinkedHashMap<>();
    if (value instanceof Map<?, ?> map) {
      for (Map.Entry<?, ?> e : map.entrySet()) {
        if (e.getKey() == null) {
          continue;
        }
        out.put(String.valueOf(e.getKey()), e.getValue() == null ? null : String.valueOf(e.getValue()));
      }
    }
    return out;
  }

  /** Coerce a JSON object value into a {@code Map<String,Object>}. */
  @SuppressWarnings("unchecked")
  private static Map<String, Object> objectMap(Object value) {
    if (value instanceof Map<?, ?> map) {
      Map<String, Object> out = new LinkedHashMap<>();
      for (Map.Entry<?, ?> e : map.entrySet()) {
        if (e.getKey() != null) {
          out.put(String.valueOf(e.getKey()), e.getValue());
        }
      }
      return out;
    }
    return new LinkedHashMap<>();
  }
}
