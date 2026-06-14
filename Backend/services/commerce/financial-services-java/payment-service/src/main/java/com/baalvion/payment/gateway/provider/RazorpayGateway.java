package com.baalvion.payment.gateway.provider;

import com.baalvion.payment.gateway.config.PspProperties;
import com.baalvion.payment.gateway.exception.WebhookVerificationException;
import com.baalvion.payment.gateway.spi.GatewayChargeRequest;
import com.baalvion.payment.gateway.spi.GatewayChargeResponse;
import com.baalvion.payment.gateway.spi.GatewayStatus;
import com.baalvion.payment.gateway.spi.PaymentGateway;
import com.baalvion.payment.gateway.spi.ProviderConfig;
import com.baalvion.payment.gateway.spi.RefundRequest;
import com.baalvion.payment.gateway.spi.RefundResult;
import com.baalvion.payment.gateway.spi.WebhookResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Razorpay PSP adapter — live implementation of the {@link PaymentGateway} SPI.
 *
 * <p>Faithful Java port of the Node adapter
 * ({@code Backend/services/commerce/payment-service/gateway/adapters/razorpay.js}):
 *
 * <ul>
 *   <li><b>initiate</b>: live → {@code POST /v1/orders} with HTTP Basic auth
 *       (base64 {@code keyId:keySecret}) and JSON body
 *       {@code {amount, currency, receipt, notes}}; mock → deterministic
 *       {@code order_mock_<hmac14>} id (no merchant account). Card vs bank/UPI/netbanking
 *       is resolved client-side from {@link com.baalvion.payment.gateway.spi.PaymentMethod}
 *       — like the Node adapter, the server returns a generic order plus {@code clientParams}
 *       (key, orderId, amount, currency, name) for the browser SDK.</li>
 *   <li><b>capture</b>: Razorpay auto-captures on payment completion (webhook
 *       {@code payment.captured} / {@code order.paid}); there is no server-side capture
 *       call in the Node flow, so this maps the charge to {@link GatewayStatus#CAPTURED}
 *       without an API round-trip.</li>
 *   <li><b>refund</b>: live → {@code POST /v1/payments/{providerPaymentId}/refund} with
 *       Basic auth and body {@code {amount}} (null amount = full refund, omit the field);
 *       mock → deterministic {@code rfnd_mock_<hmac14>}.</li>
 *   <li><b>fetchStatus</b>: live → {@code GET /v1/orders/{orderId}} reading the order
 *       {@code status} (created/attempted/paid → CREATED/CREATED/CAPTURED); mock → CREATED.
 *       (The Node adapter has no status poll; status normally arrives via webhook — this is
 *       the minimal read-path the SPI requires.)</li>
 *   <li><b>verifyAndParseWebhook</b>: REAL {@code HMAC-SHA256(rawBody, webhookSecret)} hex
 *       constant-time compared to {@code x-razorpay-signature}; replay window 600s on the
 *       top-level {@code created_at} (Unix seconds) when present. Dedup key is the
 *       body-derived {@code event:entityId} (never the attacker-settable
 *       {@code x-razorpay-event-id} header).</li>
 * </ul>
 *
 * <p>Status map (Node {@code mapStatus}): {@code payment.captured}/{@code order.paid} →
 * CAPTURED; {@code payment.authorized} → AUTHORIZED; {@code payment.failed} → FAILED;
 * {@code refund.processed}/{@code refund.created}/{@code payment.refunded} → REFUNDED;
 * unknown → FAILED.
 *
 * <p>Secrets ({@code keyId}, {@code keySecret}, {@code webhookSecret}), the base URL, and the
 * mock flag are read PER CALL from the passed {@link ProviderConfig} — never hardcoded. The
 * resolver builds it from the global {@code app.psp.razorpay.*} env (single-tenant back-compat)
 * or from the per-tenant CMS vault. The injected {@link PspProperties.Razorpay} supplies only
 * non-secret static DEFAULTS (default base URL, replay window). {@code config.mock()} flips
 * deterministic id generation on for non-prod, mirroring the Node {@code mode !== 'live'} branch.
 */
@Slf4j
@Component
public class RazorpayGateway implements PaymentGateway {

  static final String PROVIDER = "razorpay";
  private static final String MERCHANT_NAME = "Baalvion";
  private static final String HMAC_ALGORITHM = "HmacSHA256";
  private static final String SIGNATURE_HEADER = "x-razorpay-signature";
  private static final char[] HEX = "0123456789abcdef".toCharArray();
  private static final int MOCK_ID_HEX_LEN = 14;
  private static final int CONNECT_TIMEOUT_MS = 5_000;
  private static final int READ_TIMEOUT_MS = 15_000;

  /** Non-secret static defaults only (default base URL, replay window). Secrets come per-call. */
  private final PspProperties.Razorpay defaults;
  private final RestClient restClient;
  private final ObjectMapper objectMapper;

  public RazorpayGateway(PspProperties properties, ObjectMapper objectMapper) {
    this.defaults = properties.getRazorpay();
    this.objectMapper = objectMapper;
    HttpClient httpClient = HttpClient.newBuilder()
      .followRedirects(HttpClient.Redirect.NORMAL)
      .connectTimeout(Duration.ofMillis(CONNECT_TIMEOUT_MS))
      .build();
    JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
    rf.setReadTimeout(Duration.ofMillis(READ_TIMEOUT_MS));
    // No fixed baseUrl: the per-call ProviderConfig may carry a tenant-specific base URL, so
    // requests pass an absolute URI (config.baseUrlOr(default) + path) which overrides any default.
    this.restClient = RestClient.builder()
      .requestFactory(rf)
      .build();
  }

  @Override
  public String name() {
    return PROVIDER;
  }

  // ---------------------------------------------------------------- initiate (create order)

  @Override
  public GatewayChargeResponse initiate(GatewayChargeRequest request, ProviderConfig config) {
    Objects.requireNonNull(request, "request");
    Objects.requireNonNull(config, "config");
    long amount = toMinorUnits(request.amount());
    String currency = request.currency() == null ? null : request.currency().toUpperCase(Locale.ROOT);
    String receipt = request.orderRef();

    if (config.mock()) {
      String orderId = "order_mock_" + mockHash(config, receipt + ":" + amount + ":" + currency);
      Map<String, String> clientParams = clientParams(
        mockOr(config.secret("keyId"), "rzp_test_mock"), orderId, amount, currency);
      return new GatewayChargeResponse(PROVIDER, orderId, GatewayStatus.CREATED, clientParams, "{\"mocked\":true}");
    }

    // Live: POST /v1/orders with HTTP Basic auth. Body mirrors the Node adapter exactly:
    // { amount, currency, receipt, notes } where notes = the request metadata.
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("amount", amount);
    body.put("currency", currency);
    body.put("receipt", receipt);
    body.put("notes", request.metadata() == null ? Map.of() : request.metadata());

    String raw = postJson(config, "/v1/orders", body, "order create");
    JsonNode data = readTree(raw, "order create");
    String orderId = text(data, "id");
    long respAmount = data.path("amount").asLong(amount);
    String respCurrency = data.path("currency").asText(currency);

    Map<String, String> clientParams = clientParams(config.secret("keyId"), orderId, respAmount, respCurrency);
    return new GatewayChargeResponse(PROVIDER, orderId, GatewayStatus.CREATED, clientParams, raw);
  }

  // ---------------------------------------------------------------- capture (auto-capture, no API call)

  @Override
  public GatewayChargeResponse capture(String providerRef, ProviderConfig config) {
    // Razorpay captures automatically on payment completion (webhook payment.captured /
    // order.paid). The Node adapter issues no explicit capture call — capture is recorded
    // when the webhook arrives. We therefore transition to CAPTURED without an API round-trip.
    if (providerRef == null || providerRef.isBlank()) {
      throw new IllegalArgumentException("razorpay capture requires a providerRef");
    }
    log.info("Razorpay capture is automatic (no API call) for providerRef={}", providerRef);
    return new GatewayChargeResponse(PROVIDER, providerRef, GatewayStatus.CAPTURED, Map.of(), null);
  }

  // ---------------------------------------------------------------- refund

  @Override
  public RefundResult refund(RefundRequest request, ProviderConfig config) {
    Objects.requireNonNull(request, "request");
    Objects.requireNonNull(config, "config");
    String providerPaymentId = request.providerRef();
    Long amount = request.amount() == null ? null : toMinorUnits(request.amount());

    if (config.mock()) {
      String refundId = "rfnd_mock_" + mockHash(config, providerPaymentId + ":" + (amount == null ? "null" : amount));
      String raw = "{\"mocked\":true,\"providerPaymentId\":\"" + providerPaymentId + "\",\"amount\":"
        + (amount == null ? "null" : amount) + "}";
      return new RefundResult(PROVIDER, refundId, GatewayStatus.REFUNDED, request.amount(), raw);
    }

    if (providerPaymentId == null || providerPaymentId.isBlank()) {
      throw new IllegalArgumentException("razorpay refund requires a captured providerPaymentId");
    }

    // Live: POST /v1/payments/{id}/refund. Body {amount} — a null amount means a FULL
    // refund, in which case Razorpay refunds the whole captured payment (omit the field).
    Map<String, Object> body = new LinkedHashMap<>();
    if (amount != null) {
      body.put("amount", amount);
    }
    if (request.reason() != null && !request.reason().isBlank()) {
      body.put("notes", Map.of("reason", request.reason()));
    }

    String raw = postJson(config, "/v1/payments/" + providerPaymentId + "/refund", body, "refund");
    JsonNode data = readTree(raw, "refund");
    String refundId = text(data, "id");
    BigDecimal refunded = data.has("amount")
      ? BigDecimal.valueOf(data.path("amount").asLong())
      : request.amount();
    return new RefundResult(PROVIDER, refundId, GatewayStatus.REFUNDED, refunded, raw);
  }

  // ---------------------------------------------------------------- fetchStatus

  @Override
  public GatewayChargeResponse fetchStatus(String providerRef, ProviderConfig config) {
    if (providerRef == null || providerRef.isBlank()) {
      throw new IllegalArgumentException("razorpay fetchStatus requires a providerRef (order id)");
    }
    Objects.requireNonNull(config, "config");
    if (config.mock()) {
      return new GatewayChargeResponse(PROVIDER, providerRef, GatewayStatus.CREATED, Map.of(), "{\"mocked\":true}");
    }

    // Live: GET /v1/orders/{id}. Razorpay order status: created | attempted | paid.
    String raw = getJson(config, "/v1/orders/" + providerRef, "order fetch");
    JsonNode data = readTree(raw, "order fetch");
    GatewayStatus status = mapOrderStatus(data.path("status").asText(null));
    return new GatewayChargeResponse(PROVIDER, providerRef, status, Map.of(), raw);
  }

  // ---------------------------------------------------------------- webhook verify + parse

  @Override
  public WebhookResult verifyAndParseWebhook(byte[] rawBody, Map<String, String> headers, ProviderConfig config) {
    Objects.requireNonNull(config, "config");
    String raw = rawBody == null ? "" : new String(rawBody, StandardCharsets.UTF_8);
    String signature = header(headers, SIGNATURE_HEADER);

    String webhookSecret = config.secret("webhookSecret");
    if (signature == null || signature.isBlank() || webhookSecret == null || webhookSecret.isBlank()) {
      throw new WebhookVerificationException("razorpay webhook missing signature or webhook secret");
    }

    // REAL signature check: HMAC-SHA256(rawBody, webhookSecret) hex, constant-time compared.
    String expected = hmacSha256Hex(raw, webhookSecret);
    if (!timingSafeEqual(signature, expected)) {
      throw new WebhookVerificationException("razorpay webhook signature mismatch");
    }

    JsonNode body = readTree(raw, "webhook");

    // Replay window (defense-in-depth atop UNIQUE(provider, provider_event_id)): reject a
    // stale/replayed signed event when a top-level created_at is present; absent → fall back
    // to the dedup constraint (never reject a legitimate webhook for lacking the field).
    JsonNode createdAtNode = body.get("created_at");
    if (createdAtNode != null && createdAtNode.isNumber()) {
      long createdAt = createdAtNode.asLong();
      long skew = Math.abs(nowSeconds() - createdAt);
      if (skew > defaults.getReplayWindowSeconds()) {
        throw new WebhookVerificationException(
          "razorpay webhook outside replay window: skew=" + skew + "s > " + defaults.getReplayWindowSeconds() + "s");
      }
    }

    return parse(body);
  }

  /** Map the verified Razorpay event envelope to the canonical {@link WebhookResult}. */
  private WebhookResult parse(JsonNode body) {
    String event = body.path("event").asText("");
    JsonNode payload = body.path("payload");
    // Node: const entity = payEntity || orderEntity || {} — prefer the payment entity,
    // else the order entity, else an empty object so field reads stay null-safe.
    JsonNode payEntity = payload.path("payment").path("entity");
    JsonNode orderEntity = payload.path("order").path("entity");
    JsonNode entity = isObject(payEntity) ? payEntity
      : (isObject(orderEntity) ? orderEntity : objectMapper.createObjectNode());

    GatewayStatus status = mapStatus(event);

    // Dedup key derived from the SIGNED body (event:entityId), NOT the x-razorpay-event-id
    // header (attacker-settable, and rotates per delivery/retry which would defeat dedup).
    String entityId = firstNonBlank(text(payEntity, "id"), text(orderEntity, "id"));
    String providerEventId = entityId == null ? null : event + ":" + entityId;

    String providerOrderId = firstNonBlank(text(entity, "order_id"), text(orderEntity, "id"));
    BigDecimal amount = entity.has("amount") && entity.path("amount").isNumber()
      ? BigDecimal.valueOf(entity.path("amount").asLong())
      : null;

    Map<String, Object> parsed = new LinkedHashMap<>();
    parsed.put("event", event);
    parsed.put("providerOrderId", providerOrderId);
    parsed.put("providerPaymentId", text(payEntity, "id"));
    parsed.put("currency", text(entity, "currency"));
    if (amount != null) {
      parsed.put("amount", amount.longValueExact());
    }

    String eventType = "payment." + status.name().toLowerCase(Locale.ROOT);
    return new WebhookResult(PROVIDER, providerOrderId, providerEventId, eventType, status, amount, parsed);
  }

  // ---------------------------------------------------------------- status mapping

  private static GatewayStatus mapStatus(String event) {
    return switch (event) {
      case "payment.captured", "order.paid" -> GatewayStatus.CAPTURED;
      case "payment.authorized" -> GatewayStatus.AUTHORIZED;
      case "payment.failed" -> GatewayStatus.FAILED;
      case "refund.processed", "refund.created", "payment.refunded" -> GatewayStatus.REFUNDED;
      default -> GatewayStatus.FAILED;
    };
  }

  private static GatewayStatus mapOrderStatus(String orderStatus) {
    if (orderStatus == null) {
      return GatewayStatus.CREATED;
    }
    return switch (orderStatus.toLowerCase(Locale.ROOT)) {
      case "paid" -> GatewayStatus.CAPTURED;
      case "created", "attempted" -> GatewayStatus.CREATED;
      default -> GatewayStatus.CREATED;
    };
  }

  // ---------------------------------------------------------------- HTTP helpers

  private String postJson(ProviderConfig config, String path, Map<String, Object> body, String label) {
    String json = writeJson(body, label);
    try {
      String raw = restClient.post()
        .uri(baseUrl(config) + path)
        .header("Authorization", basicAuth(config))
        .contentType(MediaType.APPLICATION_JSON)
        .body(json)
        .retrieve()
        .body(String.class);
      if (raw == null || raw.isBlank()) {
        throw new IllegalStateException("razorpay " + label + " returned an empty body");
      }
      return raw;
    } catch (RestClientResponseException e) {
      // Never echo the provider's message to the caller; log status server-side only.
      log.warn("Razorpay {} failed: HTTP {}", label, e.getStatusCode().value());
      throw new IllegalStateException("razorpay " + label + " failed (HTTP " + e.getStatusCode().value() + ")", e);
    } catch (RuntimeException e) {
      log.warn("Razorpay {} transport error: {}", label, e.getMessage());
      throw new IllegalStateException("razorpay " + label + " transport error", e);
    }
  }

  private String getJson(ProviderConfig config, String path, String label) {
    try {
      String raw = restClient.get()
        .uri(baseUrl(config) + path)
        .header("Authorization", basicAuth(config))
        .retrieve()
        .body(String.class);
      if (raw == null || raw.isBlank()) {
        throw new IllegalStateException("razorpay " + label + " returned an empty body");
      }
      return raw;
    } catch (RestClientResponseException e) {
      log.warn("Razorpay {} failed: HTTP {}", label, e.getStatusCode().value());
      throw new IllegalStateException("razorpay " + label + " failed (HTTP " + e.getStatusCode().value() + ")", e);
    } catch (RuntimeException e) {
      log.warn("Razorpay {} transport error: {}", label, e.getMessage());
      throw new IllegalStateException("razorpay " + label + " transport error", e);
    }
  }

  /** Per-call base URL: tenant override from {@code config.baseUrl}, else the static default. */
  private String baseUrl(ProviderConfig config) {
    return config.baseUrlOr(defaults.getBaseUrl());
  }

  private String basicAuth(ProviderConfig config) {
    String keyId = config.secret("keyId");
    String keySecret = config.secret("keySecret");
    if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
      throw new IllegalStateException("razorpay live calls require keyId and keySecret");
    }
    String token = java.util.Base64.getEncoder()
      .encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
    return "Basic " + token;
  }

  private String writeJson(Map<String, Object> body, String label) {
    try {
      return objectMapper.writeValueAsString(body);
    } catch (Exception e) {
      throw new IllegalStateException("razorpay " + label + " request serialization failed", e);
    }
  }

  private JsonNode readTree(String raw, String label) {
    try {
      return objectMapper.readTree(raw);
    } catch (Exception e) {
      throw new IllegalStateException("razorpay " + label + " returned non-JSON body", e);
    }
  }

  // ---------------------------------------------------------------- crypto helpers

  /**
   * HMAC-SHA256 of {@code data} (UTF-8) keyed by {@code secret}, lower-case hex.
   * Refuses an empty key — an empty-key HMAC is forgeable and would silently disable
   * verification (mirrors the Node {@code hmacSha256Hex} guard).
   */
  static String hmacSha256Hex(String data, String secret) {
    if (secret == null || secret.isEmpty()) {
      throw new IllegalArgumentException("hmacSha256Hex: secret must be a non-empty string");
    }
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
      return toHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("razorpay HMAC-SHA256 computation failed", e);
    }
  }

  /** Constant-time UTF-8 comparison of two (hex) strings; length-mismatch → false. */
  static boolean timingSafeEqual(String a, String b) {
    byte[] ba = (a == null ? "" : a).getBytes(StandardCharsets.UTF_8);
    byte[] bb = (b == null ? "" : b).getBytes(StandardCharsets.UTF_8);
    if (ba.length != bb.length) {
      return false;
    }
    int diff = 0;
    for (int i = 0; i < ba.length; i++) {
      diff |= ba[i] ^ bb[i];
    }
    return diff == 0;
  }

  private static String toHex(byte[] bytes) {
    char[] out = new char[bytes.length * 2];
    for (int i = 0; i < bytes.length; i++) {
      int v = bytes[i] & 0xFF;
      out[i * 2] = HEX[v >>> 4];
      out[i * 2 + 1] = HEX[v & 0x0F];
    }
    return new String(out);
  }

  /** Deterministic mock id suffix: first 14 hex chars of HMAC(data, keySecret||"mock"). */
  private String mockHash(ProviderConfig config, String data) {
    return hmacSha256Hex(data, mockOr(config.secret("keySecret"), "mock")).substring(0, MOCK_ID_HEX_LEN);
  }

  private static long nowSeconds() {
    return System.currentTimeMillis() / 1000L;
  }

  // ---------------------------------------------------------------- misc helpers

  private static Map<String, String> clientParams(String key, String orderId, long amount, String currency) {
    Map<String, String> params = new LinkedHashMap<>();
    params.put("key", key);
    params.put("orderId", orderId);
    params.put("amount", String.valueOf(amount));
    params.put("currency", currency);
    params.put("name", MERCHANT_NAME);
    return params;
  }

  /** Convert a whole-number minor-units {@link BigDecimal} to a long, rejecting fractions. */
  private static long toMinorUnits(BigDecimal amount) {
    if (amount == null) {
      throw new IllegalArgumentException("amount is required");
    }
    return amount.longValueExact();
  }

  private static String mockOr(String value, String fallback) {
    return (value == null || value.isBlank()) ? fallback : value;
  }

  private static String header(Map<String, String> headers, String name) {
    if (headers == null) {
      return null;
    }
    String direct = headers.get(name);
    if (direct != null) {
      return direct;
    }
    // Defensive: the controller lower-cases keys, but accept any-case maps too.
    for (Map.Entry<String, String> e : headers.entrySet()) {
      if (e.getKey() != null && e.getKey().equalsIgnoreCase(name)) {
        return e.getValue();
      }
    }
    return null;
  }

  private static boolean isObject(JsonNode node) {
    return node != null && node.isObject();
  }

  private static String text(JsonNode node, String field) {
    if (node == null) {
      return null;
    }
    JsonNode v = node.get(field);
    if (v == null || v.isNull() || !v.isValueNode()) {
      return null;
    }
    String s = v.asText();
    return s.isEmpty() ? null : s;
  }

  private static String firstNonBlank(String a, String b) {
    if (a != null && !a.isBlank()) {
      return a;
    }
    return (b != null && !b.isBlank()) ? b : null;
  }
}
