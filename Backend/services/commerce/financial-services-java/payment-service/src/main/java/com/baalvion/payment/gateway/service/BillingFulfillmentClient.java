package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import com.baalvion.payment.gateway.spi.WebhookResult;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Dispatches subscription/credit fulfillment to the Node billing service after a
 * signature-verified, amount-validated CAPTURED webhook. The PSP gateway is the trust
 * anchor (it performed the provider HMAC/SHA-512 check); the call carries the shared
 * internal secret server-to-server. The Node side ({@code POST /v1/billing/fulfill})
 * activates the subscription (or tops up PAYG credit), syncs the org plan, records a
 * paid invoice, and notifies — all idempotently.
 *
 * <p><b>At-least-once contract:</b> the Node side returns 2xx for
 * applied/duplicate/terminal-skip and 5xx (503) only for a transient failure.
 * <ul>
 *   <li><b>2xx</b> → success, commit.</li>
 *   <li><b>5xx / transport error</b> → transient: throw {@link FulfillmentException}. Because this
 *       runs inside {@code GatewayService.applyWebhook}'s {@code @Transactional} method, that rolls
 *       the webhook back so the PROVIDER re-delivers and we retry. Node-side dedup keeps it exactly-once.</li>
 *   <li><b>4xx</b> → permanent client error: the charge was genuinely CAPTURED at the PSP, so we must
 *       NOT roll back (a deterministic 4xx would otherwise wedge an infinite provider-retry loop and
 *       never persist the capture). We log loudly for out-of-band reconciliation and return.</li>
 * </ul>
 */
@Slf4j
@Component
public class BillingFulfillmentClient {

  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final String fulfillUrl;
  private final String internalSecret;
  private final boolean enabled;

  public BillingFulfillmentClient(
      ObjectMapper objectMapper,
      @Value("${app.billing.fulfill-url:http://app-edge-realtime:4000/v1/billing/fulfill}") String fulfillUrl,
      @Value("${app.billing.fulfill-enabled:true}") boolean enabled,
      @Value("${app.internal-secret:${INTERNAL_SERVICE_SECRET:}}") String internalSecret) {
    this.objectMapper = objectMapper;
    this.fulfillUrl = fulfillUrl;
    this.enabled = enabled;
    this.internalSecret = internalSecret;
    if (enabled) {
      validateFulfillUrl(fulfillUrl);
      if (internalSecret == null || internalSecret.isBlank()) {
        log.warn("Billing fulfillment is enabled but app.internal-secret/INTERNAL_SERVICE_SECRET is blank "
            + "— every CAPTURED webhook dispatch will fail until it is configured.");
      }
    }
    // Pin HTTP/1.1: the Node billing service is HTTP/1.1-only. The JDK client defaults to HTTP/2 and
    // attempts a cleartext h2c upgrade, which that server rejects — surfacing as
    // "HTTP/1.1 header parser received no bytes". Forcing 1.1 avoids the upgrade handshake.
    this.httpClient = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .connectTimeout(Duration.ofSeconds(5))
        .build();
  }

  /**
   * Fulfill a captured charge. No-op (returns) for charges that carry no tenant mapping
   * (no {@code orgId} in the order metadata) — those are not Node-billing charges.
   *
   * @throws FulfillmentException on transient failure (caller's tx rolls back → retry)
   */
  public void dispatch(GatewayPayment payment, WebhookResult result, String eventId) {
    if (!enabled) {
      return;
    }
    if (internalSecret == null || internalSecret.isBlank()) {
      throw new FulfillmentException("app.internal-secret / INTERNAL_SERVICE_SECRET is not configured");
    }

    Map<String, Object> metadata = parseMetadata(payment.getRawRequest());
    Object orgId = metadata.get("orgId");
    if (orgId == null || String.valueOf(orgId).isBlank()) {
      log.debug("Fulfillment skipped (no orgId in order metadata): charge={}", payment.getId());
      return;
    }

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("provider", payment.getProvider());
    body.put("providerRef", payment.getProviderRef());
    body.put("eventId", eventId);
    // amount is persisted in MINOR units (cents); Node prefers metadata.amountMajor.
    body.put("amountMinor", payment.getAmount());
    body.put("currency", payment.getCurrency());
    body.put("metadata", metadata);

    final String json;
    try {
      json = objectMapper.writeValueAsString(body);
    } catch (Exception e) {
      // A serialization failure is deterministic — retrying won't help. Log and skip
      // rather than wedging the webhook in a permanent provider-retry loop.
      log.error("Fulfillment payload serialization failed for charge {} — skipping dispatch", payment.getId(), e);
      return;
    }

    HttpRequest request = HttpRequest.newBuilder(URI.create(fulfillUrl))
        .timeout(Duration.ofSeconds(8))
        .header("content-type", "application/json")
        .header("x-internal-secret", internalSecret)
        .header("x-internal-service", "payment-service")
        .POST(HttpRequest.BodyPublishers.ofString(json))
        .build();

    try {
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      int code = response.statusCode();
      if (code / 100 == 4) {
        // Permanent client error (malformed payload, unknown org, …). Retrying re-delivers forever
        // and never succeeds — and the charge WAS captured at the PSP, so the capture must still be
        // recorded. Do NOT throw (no rollback): log loudly for out-of-band reconciliation and return.
        log.error("Fulfillment permanently rejected (HTTP {}) for charge {} — committing the capture "
            + "without downstream fulfillment; manual reconciliation required.", code, payment.getId());
        return;
      }
      if (code / 100 != 2) {
        // 5xx / unexpected → transient: roll back so the PROVIDER re-delivers and we retry. The
        // downstream response body is intentionally NOT included in the message/logs (it can carry
        // internal detail and lands in CloudWatch); the status code + charge id are enough.
        throw new FulfillmentException(
            "billing fulfill returned HTTP " + code + " for charge " + payment.getId());
      }
      log.info("Fulfillment dispatched: charge={}, provider={}, ref={}, httpStatus={}",
          payment.getId(), payment.getProvider(), payment.getProviderRef(), code);
    } catch (FulfillmentException e) {
      throw e;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new FulfillmentException("billing fulfill interrupted for charge " + payment.getId(), e);
    } catch (Exception e) {
      throw new FulfillmentException("billing fulfill call failed for charge " + payment.getId() + ": " + e.getMessage(), e);
    }
  }

  private Map<String, Object> parseMetadata(String rawRequest) {
    if (rawRequest == null || rawRequest.isBlank()) {
      return Map.of();
    }
    try {
      Map<String, Object> parsed = objectMapper.readValue(rawRequest, new TypeReference<Map<String, Object>>() {});
      return parsed == null ? Map.of() : parsed;
    } catch (Exception e) {
      log.warn("Could not parse order metadata JSON; treating as empty: {}", e.getMessage());
      return Map.of();
    }
  }

  /**
   * SSRF guard for the configured fulfill URL. It comes from config ({@code BILLING_FULFILL_URL})
   * and is called with the internal secret in a header after every CAPTURED webhook, so a hostile
   * override must not be able to exfiltrate that secret or pivot to internal targets. Require an
   * http(s) URL to a real host, and reject cloud-metadata / link-local addresses (e.g. IMDS at
   * 169.254.169.254). Validated once at startup so a misconfig fails the deploy, not the first charge.
   */
  private static void validateFulfillUrl(String url) {
    final URI uri;
    try {
      uri = URI.create(url);
    } catch (Exception e) {
      throw new IllegalStateException("app.billing.fulfill-url is not a valid URI: " + url, e);
    }
    String scheme = uri.getScheme();
    if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
      throw new IllegalStateException("app.billing.fulfill-url must use http(s): " + url);
    }
    String host = uri.getHost();
    if (host == null || host.isBlank()) {
      throw new IllegalStateException("app.billing.fulfill-url must have a host: " + url);
    }
    String h = host.toLowerCase();
    if (h.startsWith("169.254.") || h.equals("[fe80::]") || h.startsWith("[fe80:")) {
      throw new IllegalStateException(
          "app.billing.fulfill-url must not target a link-local/metadata address: " + url);
    }
  }

  /** Transient fulfillment failure — propagated to roll back the webhook tx for provider retry. */
  public static class FulfillmentException extends RuntimeException {
    public FulfillmentException(String message) {
      super(message);
    }

    public FulfillmentException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
