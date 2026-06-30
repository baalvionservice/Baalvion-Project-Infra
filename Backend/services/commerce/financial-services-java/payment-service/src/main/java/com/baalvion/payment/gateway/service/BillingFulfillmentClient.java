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
 * applied/duplicate/terminal-skip and 503 only for a transient failure. On any non-2xx
 * (or transport error) this throws {@link FulfillmentException}; because it is invoked
 * inside {@code GatewayService.applyWebhook}'s {@code @Transactional} method, that rolls
 * the webhook back so the PROVIDER re-delivers and the call is retried. Node-side dedup
 * (and claim-release on its own transient failures) keeps retries exactly-once.
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
      if (code / 100 != 2) {
        throw new FulfillmentException(
            "billing fulfill returned " + code + " for charge " + payment.getId() + ": " + truncate(response.body()));
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

  private static String truncate(String s) {
    if (s == null) {
      return "";
    }
    return s.length() <= 300 ? s : s.substring(0, 300) + "…";
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
