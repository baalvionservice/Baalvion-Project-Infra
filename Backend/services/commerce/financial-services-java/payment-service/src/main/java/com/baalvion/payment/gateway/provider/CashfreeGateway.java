package com.baalvion.payment.gateway.provider;

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
import java.math.RoundingMode;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Cashfree Payments (PG) adapter — live implementation of the {@link PaymentGateway} SPI.
 *
 * <p>Cashfree is an <strong>order + payment-session + hosted-redirect</strong> flow:
 * <ul>
 *   <li><b>initiate</b>: live → {@code POST {baseUrl}/pg/orders} with headers
 *       {@code x-client-id}, {@code x-client-secret}, {@code x-api-version}; body carries
 *       {@code order_id, order_amount (MAJOR units), order_currency, customer_details,
 *       order_meta{return_url,notify_url}, order_tags(metadata)}. The response's
 *       {@code payment_session_id} is handed to the browser SDK
 *       (<a href="https://sdk.cashfree.com/js/v3/cashfree.js">cashfree.js v3</a>) which redirects
 *       to Cashfree's hosted checkout. mock → deterministic ids, no merchant account.</li>
 *   <li><b>capture</b>: Cashfree captures on success (webhook {@code PAYMENT_SUCCESS_WEBHOOK});
 *       no explicit capture call — maps to CAPTURED like Razorpay.</li>
 *   <li><b>refund</b>: live → {@code POST /pg/orders/{order_id}/refunds}; mock → deterministic id.</li>
 *   <li><b>fetchStatus</b>: live → {@code GET /pg/orders/{order_id}} reading {@code order_status}
 *       (PAID → CAPTURED, ACTIVE → CREATED).</li>
 *   <li><b>verifyAndParseWebhook</b>: REAL {@code base64(HMAC-SHA256(timestamp + rawBody, clientSecret))}
 *       constant-time compared to the {@code x-webhook-signature} header (timestamp =
 *       {@code x-webhook-timestamp}). This is Cashfree's documented webhook signature scheme — note it
 *       is base64 over {@code timestamp+body}, unlike Razorpay's hex-over-body.</li>
 * </ul>
 *
 * <p>Secrets ({@code clientId}, {@code clientSecret}) and the base URL come PER CALL from the passed
 * {@link ProviderConfig} (CMS vault or env), never hardcoded. Default base URL is the SANDBOX host;
 * the per-tenant {@code config.baseUrl} overrides it (set to {@code https://api.cashfree.com} for
 * production). {@code config.mock()} flips deterministic id generation for non-live tenants.
 */
@Slf4j
@Component
public class CashfreeGateway implements PaymentGateway {

  static final String PROVIDER = "cashfree";
  private static final String DEFAULT_BASE_URL = "https://sandbox.cashfree.com";
  private static final String API_VERSION = "2023-08-01";
  private static final String HMAC_ALGORITHM = "HmacSHA256";
  private static final String SIGNATURE_HEADER = "x-webhook-signature";
  private static final String TIMESTAMP_HEADER = "x-webhook-timestamp";
  private static final char[] HEX = "0123456789abcdef".toCharArray();
  private static final int MOCK_ID_HEX_LEN = 14;
  private static final int CONNECT_TIMEOUT_MS = 5_000;
  private static final int READ_TIMEOUT_MS = 15_000;
  private static final BigDecimal MINOR_PER_MAJOR = new BigDecimal("100");
  private static final String DEFAULT_EMAIL = "customer@baalvion.test";
  private static final String DEFAULT_PHONE = "9999999999";

  private final RestClient restClient;
  private final ObjectMapper objectMapper;

  public CashfreeGateway(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
    HttpClient httpClient = HttpClient.newBuilder()
      .followRedirects(HttpClient.Redirect.NORMAL)
      .connectTimeout(Duration.ofMillis(CONNECT_TIMEOUT_MS))
      .build();
    JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
    rf.setReadTimeout(Duration.ofMillis(READ_TIMEOUT_MS));
    this.restClient = RestClient.builder().requestFactory(rf).build();
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
    long minor = toMinorUnits(request.amount());
    String currency = request.currency() == null ? "INR" : request.currency().toUpperCase(Locale.ROOT);
    String amountMajor = BigDecimal.valueOf(minor).divide(MINOR_PER_MAJOR, 2, RoundingMode.HALF_UP).toPlainString();
    String seed = orEmpty(request.orderRef()) + ":" + minor + ":" + currency + ":" + orEmpty(request.idempotencyKey());
    String orderId = "cfo_" + (config.mock() ? "mock_" : "") + mockHash(config, seed);

    if (config.mock()) {
      Map<String, String> cp = clientParams("cf_session_mock_" + mockHash(config, "sess:" + seed), orderId, config);
      return new GatewayChargeResponse(PROVIDER, orderId, GatewayStatus.CREATED, cp, "{\"mocked\":true}");
    }

    Map<String, String> customer = request.customer();
    Map<String, Object> customerDetails = new LinkedHashMap<>();
    customerDetails.put("customer_id", firstNonBlank(customer.get("customer_id"), hashId(request)));
    customerDetails.put("customer_email", firstNonBlank(customer.get("email"), DEFAULT_EMAIL));
    customerDetails.put("customer_phone", firstNonBlank(customer.get("contact"), customer.get("phone"), DEFAULT_PHONE));

    Map<String, Object> orderMeta = new LinkedHashMap<>();
    String returnUrl = request.metadata().get("returnUrl");
    String notifyUrl = request.metadata().get("notifyUrl");
    if (returnUrl != null && !returnUrl.isBlank()) orderMeta.put("return_url", returnUrl);
    if (notifyUrl != null && !notifyUrl.isBlank()) orderMeta.put("notify_url", notifyUrl);

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("order_id", orderId);
    body.put("order_amount", new BigDecimal(amountMajor));
    body.put("order_currency", currency);
    body.put("customer_details", customerDetails);
    if (!orderMeta.isEmpty()) body.put("order_meta", orderMeta);
    if (!request.metadata().isEmpty()) body.put("order_tags", request.metadata());

    String raw = postJson(config, "/pg/orders", body, "order create");
    JsonNode data = readTree(raw, "order create");
    String paymentSessionId = text(data, "payment_session_id");
    String respOrderId = firstNonBlank(text(data, "order_id"), orderId);

    Map<String, String> cp = clientParams(paymentSessionId, respOrderId, config);
    return new GatewayChargeResponse(PROVIDER, respOrderId, GatewayStatus.CREATED, cp, raw);
  }

  // ---------------------------------------------------------------- capture (auto-capture)

  @Override
  public GatewayChargeResponse capture(String providerRef, ProviderConfig config) {
    if (providerRef == null || providerRef.isBlank()) {
      throw new IllegalArgumentException("cashfree capture requires a providerRef");
    }
    log.info("Cashfree capture is automatic (settled on PAYMENT_SUCCESS) for providerRef={}", providerRef);
    return new GatewayChargeResponse(PROVIDER, providerRef, GatewayStatus.CAPTURED, Map.of(), null);
  }

  // ---------------------------------------------------------------- refund

  @Override
  public RefundResult refund(RefundRequest request, ProviderConfig config) {
    Objects.requireNonNull(request, "request");
    Objects.requireNonNull(config, "config");
    String orderId = request.providerRef();
    Long minor = request.amount() == null ? null : toMinorUnits(request.amount());

    if (config.mock()) {
      String refundId = "cfr_mock_" + mockHash(config, orderId + ":" + (minor == null ? "null" : minor));
      return new RefundResult(PROVIDER, refundId, GatewayStatus.REFUNDED, request.amount(),
        "{\"mocked\":true,\"order_id\":\"" + orEmpty(orderId) + "\"}");
    }
    if (orderId == null || orderId.isBlank()) {
      throw new IllegalArgumentException("cashfree refund requires the order_id (providerRef)");
    }

    Map<String, Object> body = new LinkedHashMap<>();
    String refundId = "cfr_" + mockHash(config, orderId + ":" + System.nanoTime());
    body.put("refund_id", refundId);
    if (minor != null) {
      body.put("refund_amount", BigDecimal.valueOf(minor).divide(MINOR_PER_MAJOR, 2, RoundingMode.HALF_UP));
    }
    if (request.reason() != null && !request.reason().isBlank()) {
      body.put("refund_note", request.reason());
    }
    String raw = postJson(config, "/pg/orders/" + orderId + "/refunds", body, "refund");
    JsonNode data = readTree(raw, "refund");
    String providerRefundId = firstNonBlank(text(data, "refund_id"), refundId);
    return new RefundResult(PROVIDER, providerRefundId, GatewayStatus.REFUNDED, request.amount(), raw);
  }

  // ---------------------------------------------------------------- fetchStatus

  @Override
  public GatewayChargeResponse fetchStatus(String providerRef, ProviderConfig config) {
    if (providerRef == null || providerRef.isBlank()) {
      throw new IllegalArgumentException("cashfree fetchStatus requires the order_id (providerRef)");
    }
    Objects.requireNonNull(config, "config");
    if (config.mock()) {
      return new GatewayChargeResponse(PROVIDER, providerRef, GatewayStatus.CREATED, Map.of(), "{\"mocked\":true}");
    }
    String raw = getJson(config, "/pg/orders/" + providerRef, "order fetch");
    JsonNode data = readTree(raw, "order fetch");
    GatewayStatus status = mapOrderStatus(text(data, "order_status"));
    return new GatewayChargeResponse(PROVIDER, providerRef, status, Map.of(), raw);
  }

  // ---------------------------------------------------------------- webhook verify + parse

  @Override
  public WebhookResult verifyAndParseWebhook(byte[] rawBody, Map<String, String> headers, ProviderConfig config) {
    Objects.requireNonNull(config, "config");
    String raw = rawBody == null ? "" : new String(rawBody, StandardCharsets.UTF_8);
    String signature = header(headers, SIGNATURE_HEADER);
    String timestamp = header(headers, TIMESTAMP_HEADER);
    String clientSecret = config.secret("clientSecret");
    if (signature == null || signature.isBlank() || timestamp == null || timestamp.isBlank()
        || clientSecret == null || clientSecret.isBlank()) {
      throw new WebhookVerificationException("cashfree webhook missing signature, timestamp, or client secret");
    }

    // REAL signature: base64(HMAC-SHA256(timestamp + rawBody, clientSecret)), constant-time compared.
    String expected = hmacSha256Base64(timestamp + raw, clientSecret);
    if (!timingSafeEqual(signature, expected)) {
      throw new WebhookVerificationException("cashfree webhook signature mismatch");
    }

    JsonNode body = readTree(raw, "webhook");
    return parse(body);
  }

  private WebhookResult parse(JsonNode body) {
    String type = body.path("type").asText("");
    GatewayStatus status = mapStatus(type);
    JsonNode data = body.path("data");
    JsonNode order = data.path("order");
    JsonNode payment = data.path("payment");

    String orderId = text(order, "order_id");
    String cfPaymentId = firstNonBlank(text(payment, "cf_payment_id"), text(payment, "payment_id"));
    // Dedup key from the SIGNED body: prefer the payment id, else type:orderId.
    String providerEventId = cfPaymentId != null ? cfPaymentId : (orderId != null ? type + ":" + orderId : null);

    BigDecimal amount = null;
    JsonNode amtNode = order.path("order_amount");
    if (amtNode.isNumber()) {
      // order_amount is MAJOR units → convert to MINOR for the canonical contract.
      amount = amtNode.decimalValue().multiply(MINOR_PER_MAJOR).setScale(0, RoundingMode.HALF_UP);
    }

    Map<String, Object> parsed = new LinkedHashMap<>();
    parsed.put("type", type);
    parsed.put("providerOrderId", orderId);
    parsed.put("providerPaymentId", cfPaymentId);
    String email = text(data.path("customer_details"), "customer_email");
    if (email != null) parsed.put("customerEmail", email);
    if (amount != null) parsed.put("amount", amount.longValueExact());

    String eventType = "payment." + status.name().toLowerCase(Locale.ROOT);
    return new WebhookResult(PROVIDER, orderId, providerEventId, eventType, status, amount, parsed);
  }

  private static GatewayStatus mapStatus(String type) {
    String t = type == null ? "" : type.toUpperCase(Locale.ROOT);
    if (t.startsWith("PAYMENT_SUCCESS")) return GatewayStatus.CAPTURED;
    if (t.startsWith("PAYMENT_USER_DROPPED") || t.startsWith("PAYMENT_FAILED")) return GatewayStatus.FAILED;
    if (t.contains("REFUND")) return GatewayStatus.REFUNDED;
    return GatewayStatus.FAILED;
  }

  private static GatewayStatus mapOrderStatus(String orderStatus) {
    if (orderStatus == null) return GatewayStatus.CREATED;
    return switch (orderStatus.toUpperCase(Locale.ROOT)) {
      case "PAID" -> GatewayStatus.CAPTURED;
      default -> GatewayStatus.CREATED;
    };
  }

  // ---------------------------------------------------------------- HTTP helpers

  private String postJson(ProviderConfig config, String path, Map<String, Object> body, String label) {
    String json = writeJson(body, label);
    try {
      String raw = restClient.post()
        .uri(baseUrl(config) + path)
        .header("x-client-id", requireSecret(config.secret("clientId"), "cashfree clientId"))
        .header("x-client-secret", requireSecret(config.secret("clientSecret"), "cashfree clientSecret"))
        .header("x-api-version", API_VERSION)
        .contentType(MediaType.APPLICATION_JSON)
        .body(json)
        .retrieve()
        .body(String.class);
      if (raw == null || raw.isBlank()) {
        throw new IllegalStateException("cashfree " + label + " returned an empty body");
      }
      return raw;
    } catch (RestClientResponseException e) {
      log.warn("Cashfree {} failed: HTTP {}", label, e.getStatusCode().value());
      throw new IllegalStateException("cashfree " + label + " failed (HTTP " + e.getStatusCode().value() + ")", e);
    } catch (RuntimeException e) {
      log.warn("Cashfree {} transport error: {}", label, e.getMessage());
      throw new IllegalStateException("cashfree " + label + " transport error", e);
    }
  }

  private String getJson(ProviderConfig config, String path, String label) {
    try {
      String raw = restClient.get()
        .uri(baseUrl(config) + path)
        .header("x-client-id", requireSecret(config.secret("clientId"), "cashfree clientId"))
        .header("x-client-secret", requireSecret(config.secret("clientSecret"), "cashfree clientSecret"))
        .header("x-api-version", API_VERSION)
        .retrieve()
        .body(String.class);
      if (raw == null || raw.isBlank()) {
        throw new IllegalStateException("cashfree " + label + " returned an empty body");
      }
      return raw;
    } catch (RestClientResponseException e) {
      log.warn("Cashfree {} failed: HTTP {}", label, e.getStatusCode().value());
      throw new IllegalStateException("cashfree " + label + " failed (HTTP " + e.getStatusCode().value() + ")", e);
    } catch (RuntimeException e) {
      log.warn("Cashfree {} transport error: {}", label, e.getMessage());
      throw new IllegalStateException("cashfree " + label + " transport error", e);
    }
  }

  private String baseUrl(ProviderConfig config) {
    return config.baseUrlOr(DEFAULT_BASE_URL);
  }

  // ---------------------------------------------------------------- crypto helpers

  /** base64(HMAC-SHA256(data, secret)) — Cashfree's webhook signature encoding. */
  static String hmacSha256Base64(String data, String secret) {
    if (secret == null || secret.isEmpty()) {
      throw new IllegalArgumentException("hmacSha256Base64: secret must be a non-empty string");
    }
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
      return Base64.getEncoder().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("cashfree HMAC-SHA256 computation failed", e);
    }
  }

  static boolean timingSafeEqual(String a, String b) {
    byte[] ba = (a == null ? "" : a).getBytes(StandardCharsets.UTF_8);
    byte[] bb = (b == null ? "" : b).getBytes(StandardCharsets.UTF_8);
    if (ba.length != bb.length) return false;
    int diff = 0;
    for (int i = 0; i < ba.length; i++) {
      diff |= ba[i] ^ bb[i];
    }
    return diff == 0;
  }

  private String mockHash(ProviderConfig config, String data) {
    String key = mockOr(config.secret("clientSecret"), "mock");
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
      return toHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8))).substring(0, MOCK_ID_HEX_LEN);
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("cashfree mock-hash computation failed", e);
    }
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

  // ---------------------------------------------------------------- misc helpers

  /** Non-secret client params for the browser SDK: payment_session_id + sandbox/production mode. */
  private static Map<String, String> clientParams(String paymentSessionId, String orderId, ProviderConfig config) {
    Map<String, String> params = new LinkedHashMap<>();
    params.put("paymentSessionId", paymentSessionId);
    params.put("orderId", orderId);
    // The cashfree.js v3 SDK takes mode "sandbox" | "production"; derive from the (non-secret) base URL.
    String base = config.baseUrlOr(DEFAULT_BASE_URL);
    params.put("mode", base.contains("sandbox") ? "sandbox" : "production");
    return params;
  }

  private static String hashId(GatewayChargeRequest request) {
    String basis = orEmpty(request.orderRef()) + orEmpty(request.idempotencyKey());
    int h = basis.hashCode();
    return "cust_" + Integer.toHexString(h == Integer.MIN_VALUE ? 0 : Math.abs(h));
  }

  private static long toMinorUnits(BigDecimal amount) {
    if (amount == null) {
      throw new IllegalArgumentException("amount is required");
    }
    return amount.longValueExact();
  }

  private String writeJson(Map<String, Object> body, String label) {
    try {
      return objectMapper.writeValueAsString(body);
    } catch (Exception e) {
      throw new IllegalStateException("cashfree " + label + " request serialization failed", e);
    }
  }

  private JsonNode readTree(String raw, String label) {
    try {
      return objectMapper.readTree(raw);
    } catch (Exception e) {
      throw new IllegalStateException("cashfree " + label + " returned non-JSON body", e);
    }
  }

  private static String requireSecret(String value, String label) {
    if (value == null || value.isBlank()) {
      throw new IllegalStateException(label + " is not configured");
    }
    return value;
  }

  private static String mockOr(String value, String fallback) {
    return (value == null || value.isBlank()) ? fallback : value;
  }

  private static String orEmpty(String value) {
    return value == null ? "" : value;
  }

  private static String header(Map<String, String> headers, String name) {
    if (headers == null) return null;
    String direct = headers.get(name);
    if (direct != null) return direct;
    for (Map.Entry<String, String> e : headers.entrySet()) {
      if (e.getKey() != null && e.getKey().equalsIgnoreCase(name)) return e.getValue();
    }
    return null;
  }

  private static String text(JsonNode node, String field) {
    if (node == null) return null;
    JsonNode v = node.get(field);
    if (v == null || v.isNull() || !v.isValueNode()) return null;
    String s = v.asText();
    return s.isEmpty() ? null : s;
  }

  private static String firstNonBlank(String... vals) {
    if (vals != null) {
      for (String v : vals) {
        if (v != null && !v.isBlank()) return v;
      }
    }
    return null;
  }
}
