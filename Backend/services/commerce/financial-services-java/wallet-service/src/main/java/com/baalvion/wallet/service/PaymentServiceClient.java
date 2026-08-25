package com.baalvion.wallet.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Outbound client to payment-service's generic PSP gateway, used to create the crypto charge for
 * a wallet top-up. Mirrors BillingFulfillmentClient's construction (HTTP/1.1 pinned, timeouts,
 * SSRF-guarded configured URL) and giftcard-service's checkout() call shape exactly — same
 * headers, same metadata.fulfillTarget dispatch key, just issued from Java instead of Node.
 */
@Slf4j
@Component
public class PaymentServiceClient {

  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final String gatewayUrl;
  private final String internalSecret;

  public PaymentServiceClient(
      ObjectMapper objectMapper,
      @Value("${app.payment.gateway-url:http://app-payments:3015/v1/gateway/payments}") String gatewayUrl,
      @Value("${app.internal-secret:${INTERNAL_SERVICE_SECRET:}}") String internalSecret) {
    this.objectMapper = objectMapper;
    this.gatewayUrl = gatewayUrl;
    this.internalSecret = internalSecret;
    validateGatewayUrl(gatewayUrl);
    this.httpClient = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .connectTimeout(Duration.ofSeconds(5))
        .build();
  }

  public static class InitiatedCharge {
    public final UUID chargeId;
    public final String asset;
    public final String network;
    public final String address;
    public final String amountValue;
    public final String amountDisplay;
    public final String expiresAt;

    InitiatedCharge(UUID chargeId, String asset, String network, String address,
                     String amountValue, String amountDisplay, String expiresAt) {
      this.chargeId = chargeId;
      this.asset = asset;
      this.network = network;
      this.address = address;
      this.amountValue = amountValue;
      this.amountDisplay = amountDisplay;
      this.expiresAt = expiresAt;
    }
  }

  public InitiatedCharge initiate(UUID depositId, UUID holderId, UUID walletId, BigDecimal amountUsd, String asset) {
    if (internalSecret == null || internalSecret.isBlank()) {
      throw new IllegalStateException("app.internal-secret / INTERNAL_SERVICE_SECRET is not configured");
    }
    long amountCents = amountUsd.setScale(2, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100)).longValueExact();

    Map<String, Object> metadata = new LinkedHashMap<>();
    metadata.put("fulfillTarget", "wallet");
    metadata.put("holderId", holderId.toString());
    metadata.put("walletId", walletId.toString());
    metadata.put("depositId", depositId.toString());
    metadata.put("cryptoAsset", asset);

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("provider", "crypto");
    body.put("amount", amountCents);
    body.put("currency", "USD");
    body.put("method", "CRYPTO");
    body.put("orderRef", "wallet-deposit:" + depositId);
    body.put("metadata", metadata);

    final String json;
    try {
      json = objectMapper.writeValueAsString(body);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to serialize deposit charge request for deposit " + depositId, e);
    }

    HttpRequest request = HttpRequest.newBuilder(URI.create(gatewayUrl))
        .timeout(Duration.ofSeconds(8))
        .header("content-type", "application/json")
        .header("idempotency-key", depositId.toString())
        .header("x-internal-secret", internalSecret)
        .header("x-internal-service", "wallet-service")
        .POST(HttpRequest.BodyPublishers.ofString(json))
        .build();

    HttpResponse<String> response;
    try {
      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (Exception e) {
      throw new IllegalStateException("payment-service unreachable for deposit " + depositId, e);
    }
    if (response.statusCode() / 100 != 2) {
      log.error("payment-service rejected deposit charge (HTTP {}) for deposit {}", response.statusCode(), depositId);
      throw new IllegalStateException("Failed to create deposit charge: HTTP " + response.statusCode());
    }

    try {
      @SuppressWarnings("unchecked")
      Map<String, Object> parsed = objectMapper.readValue(response.body(), Map.class);
      @SuppressWarnings("unchecked")
      Map<String, String> clientParams = (Map<String, String>) parsed.getOrDefault("clientParams", Map.of());
      UUID chargeId = UUID.fromString(String.valueOf(parsed.get("id")));
      return new InitiatedCharge(
          chargeId,
          clientParams.getOrDefault("asset", asset),
          clientParams.get("network"),
          clientParams.get("address"),
          clientParams.get("amountValue"),
          clientParams.get("amountDisplay"),
          clientParams.get("expiresAt"));
    } catch (Exception e) {
      throw new IllegalStateException("Malformed response from payment-service for deposit " + depositId, e);
    }
  }

  /** SSRF guard, mirrors BillingFulfillmentClient.validateFulfillUrl exactly. */
  private static void validateGatewayUrl(String url) {
    final URI uri;
    try {
      uri = URI.create(url);
    } catch (Exception e) {
      throw new IllegalStateException("app.payment.gateway-url is not a valid URI: " + url, e);
    }
    String scheme = uri.getScheme();
    if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
      throw new IllegalStateException("app.payment.gateway-url must use http(s): " + url);
    }
    String host = uri.getHost();
    if (host == null || host.isBlank()) {
      throw new IllegalStateException("app.payment.gateway-url must have a host: " + url);
    }
    String h = host.toLowerCase();
    if (h.startsWith("169.254.") || h.equals("[fe80::]") || h.startsWith("[fe80:")) {
      throw new IllegalStateException("app.payment.gateway-url must not target a link-local/metadata address: " + url);
    }
  }
}
