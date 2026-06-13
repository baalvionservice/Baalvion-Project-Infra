package com.baalvion.payment.gateway.provider;

import com.baalvion.payment.gateway.config.PspProperties;
import com.baalvion.payment.gateway.exception.WebhookVerificationException;
import com.baalvion.payment.gateway.spi.GatewayChargeRequest;
import com.baalvion.payment.gateway.spi.GatewayChargeResponse;
import com.baalvion.payment.gateway.spi.GatewayStatus;
import com.baalvion.payment.gateway.spi.PaymentGateway;
import com.baalvion.payment.gateway.spi.RefundRequest;
import com.baalvion.payment.gateway.spi.RefundResult;
import com.baalvion.payment.gateway.spi.WebhookResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Stripe PSP adapter — faithful Java port of the Node {@code gateway/adapters/stripe.js}.
 *
 * <p><b>initiate</b>: create a PaymentIntent. Live →
 * {@code POST {baseUrl}/v1/payment_intents} with {@code Authorization: Bearer {secretKey}}
 * and a {@code application/x-www-form-urlencoded} body
 * ({@code amount}, {@code currency} lower-cased, {@code automatic_payment_methods[enabled]=true},
 * and {@code metadata[receipt]={orderRef}} when present). Stripe returns a single generic
 * intent regardless of the customer-selected instrument (CARD/BANK/UPI/NETBANKING) — the
 * concrete payment method is chosen client-side via the returned {@code clientSecret}, so the
 * SPI {@code method} is advisory only and does not change the create call. Mock →
 * deterministic {@code pi_mock_<hash>} + {@code <id>_secret_mock}.
 *
 * <p><b>capture</b>: Stripe captures automatically on a successful PaymentIntent (signalled by
 * the {@code payment_intent.succeeded}/{@code charge.succeeded} webhook). The service never
 * calls an explicit capture endpoint, so {@link #capture(String)} simply reports the current
 * intent status (delegates to {@link #fetchStatus(String)}).
 *
 * <p><b>refund</b>: Live → {@code POST {baseUrl}/v1/refunds} with Bearer auth and a form body
 * {@code payment_intent={providerRef}} plus {@code amount} for a PARTIAL refund; a {@code null}
 * amount omits the form field, which Stripe treats as a FULL refund. Mock → deterministic
 * {@code re_mock_<hash>}.
 *
 * <p><b>verifyAndParseWebhook</b>: REAL Stripe signature scheme. Reads the
 * {@code stripe-signature} header ({@code t=<ts>,v1=<hex>[,v1=<hex>...]}), enforces the
 * {@code toleranceSeconds} (300s) window on {@code t}, and compares
 * {@code HMAC-SHA256("{t}.{rawBody}", webhookSecret)} (lower-case hex) against each {@code v1}
 * candidate in constant time. On mismatch it throws {@link WebhookVerificationException};
 * a returned {@link WebhookResult} therefore always represents an authenticated event. Status
 * map: {@code payment_intent.succeeded}/{@code charge.succeeded} → CAPTURED;
 * {@code payment_intent.amount_capturable_updated}/{@code payment_intent.requires_action} →
 * AUTHORIZED; {@code payment_intent.payment_failed}/{@code charge.failed} → FAILED;
 * {@code charge.refunded}/{@code refund.created} → REFUNDED; anything else → FAILED. For charge
 * events the canonical order id is {@code obj.payment_intent} (the PaymentIntent id we stored at
 * create time), not the charge id.
 */
@Component
public class StripeGateway implements PaymentGateway {

  static final String PROVIDER = "stripe";

  private static final String HMAC_ALGORITHM = "HmacSHA256";
  private static final String INTENTS_PATH = "/v1/payment_intents";
  private static final String REFUNDS_PATH = "/v1/refunds";
  private static final String SIGNATURE_HEADER = "stripe-signature";
  private static final int MOCK_ID_HEX_LEN = 14;

  private final PspProperties.Stripe config;
  private final boolean mock;
  private final ObjectMapper objectMapper;
  private final RestClient restClient;

  public StripeGateway(PspProperties properties, ObjectMapper objectMapper) {
    this.config = properties.getStripe();
    this.mock = properties.isMock();
    this.objectMapper = objectMapper;
    this.restClient = RestClient.builder()
      .baseUrl(config.getBaseUrl())
      .build();
  }

  @Override
  public String name() {
    return PROVIDER;
  }

  // ---------------------------------------------------------------------------
  // initiate — create a PaymentIntent (stripe.js:createOrder)
  // ---------------------------------------------------------------------------

  @Override
  public GatewayChargeResponse initiate(GatewayChargeRequest request) {
    Objects.requireNonNull(request, "charge request must not be null");
    long amount = toMinorUnits(request.amount());
    String currency = request.currency() == null ? "" : request.currency().toLowerCase(Locale.ROOT);
    String receipt = request.orderRef();

    if (mock) {
      return mockInitiate(amount, currency, receipt);
    }
    return liveInitiate(amount, currency, receipt);
  }

  private GatewayChargeResponse mockInitiate(long amount, String currency, String receipt) {
    String seedSecret = secretOrDefault(config.getSecretKey(), "mock");
    String id = "pi_mock_" + hmacSha256Hex(receipt + ":" + amount + ":" + currency, seedSecret)
      .substring(0, MOCK_ID_HEX_LEN);

    Map<String, String> clientParams = new LinkedHashMap<>();
    clientParams.put("clientSecret", id + "_secret_mock");
    clientParams.put("publishableKey", publishableOrDefault());
    clientParams.put("amount", String.valueOf(amount));
    clientParams.put("currency", currency);

    return new GatewayChargeResponse(PROVIDER, id, GatewayStatus.CREATED, clientParams, "{\"mocked\":true}");
  }

  private GatewayChargeResponse liveInitiate(long amount, String currency, String receipt) {
    requireSecretKey();

    StringBuilder form = new StringBuilder()
      .append("amount=").append(formEncode(String.valueOf(amount)))
      .append("&currency=").append(formEncode(currency))
      .append("&automatic_payment_methods[enabled]=true");
    if (receipt != null && !receipt.isBlank()) {
      form.append("&metadata[receipt]=").append(formEncode(receipt));
    }

    String responseBody = post(INTENTS_PATH, form.toString(), "intent create");
    JsonNode data = readTree(responseBody, "intent create");

    String providerRef = textOrNull(data, "id");
    if (providerRef == null) {
      throw new IllegalStateException("Stripe intent create returned no id");
    }

    Map<String, String> clientParams = new LinkedHashMap<>();
    clientParams.put("clientSecret", textOrEmpty(data, "client_secret"));
    clientParams.put("publishableKey", config.getPublishableKey() == null ? "" : config.getPublishableKey());
    clientParams.put("amount", textOrEmpty(data, "amount"));
    clientParams.put("currency", textOrEmpty(data, "currency"));

    GatewayStatus status = mapIntentStatus(textOrNull(data, "status"));
    return new GatewayChargeResponse(PROVIDER, providerRef, status, clientParams, responseBody);
  }

  // ---------------------------------------------------------------------------
  // capture — Stripe auto-captures via webhook; report current intent status
  // ---------------------------------------------------------------------------

  @Override
  public GatewayChargeResponse capture(String providerRef) {
    // Node note (stripe.js): "Service does not explicitly call capture endpoint; Stripe
    // manages it." Capture happens on the payment_intent.succeeded/charge.succeeded webhook.
    // We therefore surface the current intent status rather than calling a capture endpoint.
    return fetchStatus(providerRef);
  }

  // ---------------------------------------------------------------------------
  // refund — POST /v1/refunds (stripe.js:refund); partial when amount present
  // ---------------------------------------------------------------------------

  @Override
  public RefundResult refund(RefundRequest request) {
    Objects.requireNonNull(request, "refund request must not be null");
    String intent = request.providerRef();
    if (intent == null || intent.isBlank()) {
      throw new IllegalArgumentException("Stripe refund requires a PaymentIntent id");
    }
    BigDecimal amount = request.amount();

    if (mock) {
      String seedSecret = secretOrDefault(config.getSecretKey(), "mock");
      String amountSeed = amount == null ? "null" : String.valueOf(toMinorUnits(amount));
      String providerRefundId = "re_mock_"
        + hmacSha256Hex(intent + ":" + amountSeed, seedSecret).substring(0, MOCK_ID_HEX_LEN);
      return new RefundResult(PROVIDER, providerRefundId, GatewayStatus.REFUNDED, amount,
        "{\"mocked\":true,\"paymentIntent\":\"" + jsonEscape(intent) + "\"}");
    }

    requireSecretKey();
    StringBuilder form = new StringBuilder()
      .append("payment_intent=").append(formEncode(intent));
    // null amount => full refund: Stripe refunds the entire charge when amount is omitted.
    if (amount != null) {
      form.append("&amount=").append(formEncode(String.valueOf(toMinorUnits(amount))));
    }

    String responseBody = post(REFUNDS_PATH, form.toString(), "refund");
    JsonNode data = readTree(responseBody, "refund");
    String providerRefundId = textOrNull(data, "id");
    if (providerRefundId == null) {
      throw new IllegalStateException("Stripe refund returned no id");
    }
    return new RefundResult(PROVIDER, providerRefundId, GatewayStatus.REFUNDED, amount, responseBody);
  }

  // ---------------------------------------------------------------------------
  // fetchStatus — GET /v1/payment_intents/{id}
  // ---------------------------------------------------------------------------

  @Override
  public GatewayChargeResponse fetchStatus(String providerRef) {
    if (providerRef == null || providerRef.isBlank()) {
      throw new IllegalArgumentException("Stripe fetchStatus requires a PaymentIntent id");
    }
    if (mock) {
      // No live intent to poll; the deterministic mock intent stays CREATED until a webhook arrives.
      return new GatewayChargeResponse(PROVIDER, providerRef, GatewayStatus.CREATED, Map.of(), "{\"mocked\":true}");
    }

    requireSecretKey();
    String responseBody;
    try {
      responseBody = restClient.get()
        .uri(INTENTS_PATH + "/" + formEncodePathSegment(providerRef))
        .header("Authorization", bearer())
        .retrieve()
        .body(String.class);
    } catch (RestClientResponseException ex) {
      throw new IllegalStateException(
        "Stripe intent fetch failed (HTTP " + ex.getStatusCode().value() + ")", ex);
    } catch (RuntimeException ex) {
      throw new IllegalStateException("Stripe intent fetch failed: transport error", ex);
    }

    JsonNode data = readTree(responseBody, "intent fetch");
    GatewayStatus status = mapIntentStatus(textOrNull(data, "status"));
    return new GatewayChargeResponse(PROVIDER, providerRef, status, Map.of(), responseBody);
  }

  // ---------------------------------------------------------------------------
  // verifyAndParseWebhook — REAL Stripe signed-payload verification (stripe.js:53-91)
  // ---------------------------------------------------------------------------

  @Override
  public WebhookResult verifyAndParseWebhook(byte[] rawBody, Map<String, String> headers) {
    if (rawBody == null) {
      rawBody = new byte[0];
    }
    if (headers == null) {
      throw new WebhookVerificationException("Stripe webhook missing headers");
    }
    if (config.getWebhookSecret() == null || config.getWebhookSecret().isBlank()) {
      throw new WebhookVerificationException("Stripe webhook secret is not configured");
    }

    String header = caseInsensitiveHeader(headers, SIGNATURE_HEADER);
    if (header == null || header.isBlank()) {
      throw new WebhookVerificationException("Stripe webhook missing " + SIGNATURE_HEADER + " header");
    }

    SignatureHeader parsed = parseSignatureHeader(header);
    if (parsed.timestamp() == null || parsed.signatures().isEmpty()) {
      throw new WebhookVerificationException("Stripe webhook signature header is malformed");
    }

    long ts;
    try {
      ts = Long.parseLong(parsed.timestamp());
    } catch (NumberFormatException ex) {
      throw new WebhookVerificationException("Stripe webhook timestamp is not numeric", ex);
    }
    long skew = Math.abs(nowSeconds() - ts);
    if (skew > config.getToleranceSeconds()) {
      throw new WebhookVerificationException(
        "Stripe webhook timestamp outside tolerance window (" + skew + "s > "
          + config.getToleranceSeconds() + "s)");
    }

    String body = new String(rawBody, StandardCharsets.UTF_8);
    String expected = hmacSha256Hex(parsed.timestamp() + "." + body, config.getWebhookSecret());
    boolean matched = parsed.signatures().stream().anyMatch(sig -> constantTimeEquals(sig, expected));
    if (!matched) {
      throw new WebhookVerificationException("Stripe webhook signature mismatch");
    }

    return parseWebhook(body);
  }

  private WebhookResult parseWebhook(String body) {
    JsonNode root = readTree(body, "webhook");
    String type = textOrEmpty(root, "type");
    GatewayStatus status = mapWebhookStatus(type);

    JsonNode obj = root.path("data").path("object");
    String objectType = textOrNull(obj, "object");
    String chargePaymentIntent = textOrNull(obj, "payment_intent");
    String objId = textOrNull(obj, "id");
    // For charge events the stored canonical id is the PaymentIntent (obj.payment_intent),
    // not the charge id (stripe.js:80).
    String providerRef = "charge".equals(objectType) ? chargePaymentIntent : objId;
    if (providerRef == null) {
      providerRef = objId;
    }

    BigDecimal amount = readAmount(obj);

    String providerEventId = textOrNull(root, "id");
    String eventType = "payment." + status.name().toLowerCase(Locale.ROOT);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("providerEventId", providerEventId);
    payload.put("eventType", eventType);
    payload.put("stripeEventType", type);
    payload.put("providerOrderId", providerRef);
    payload.put("providerPaymentId", objId);
    payload.put("status", status.name());
    String currency = textOrNull(obj, "currency");
    if (currency != null) {
      payload.put("currency", currency.toUpperCase(Locale.ROOT));
    }
    if (amount != null) {
      payload.put("amount", amount);
    }

    return new WebhookResult(PROVIDER, providerRef, providerEventId, eventType, status, amount, payload);
  }

  // ---------------------------------------------------------------------------
  // status mapping
  // ---------------------------------------------------------------------------

  /** Maps a Stripe webhook event type onto the canonical status (stripe.js:mapStatus). */
  private static GatewayStatus mapWebhookStatus(String type) {
    return switch (type == null ? "" : type) {
      case "payment_intent.succeeded", "charge.succeeded" -> GatewayStatus.CAPTURED;
      case "payment_intent.amount_capturable_updated", "payment_intent.requires_action" -> GatewayStatus.AUTHORIZED;
      case "payment_intent.payment_failed", "charge.failed" -> GatewayStatus.FAILED;
      case "charge.refunded", "refund.created" -> GatewayStatus.REFUNDED;
      default -> GatewayStatus.FAILED;
    };
  }

  /** Maps a PaymentIntent {@code status} field (from create/fetch responses) onto the canonical status. */
  private static GatewayStatus mapIntentStatus(String status) {
    return switch (status == null ? "" : status) {
      case "succeeded" -> GatewayStatus.CAPTURED;
      case "requires_capture" -> GatewayStatus.AUTHORIZED;
      case "canceled" -> GatewayStatus.FAILED;
      case "requires_payment_method", "requires_confirmation", "requires_action", "processing", "" ->
        GatewayStatus.CREATED;
      default -> GatewayStatus.CREATED;
    };
  }

  private static BigDecimal readAmount(JsonNode obj) {
    if (obj.hasNonNull("amount")) {
      return BigDecimal.valueOf(obj.get("amount").asLong());
    }
    if (obj.hasNonNull("amount_received")) {
      return BigDecimal.valueOf(obj.get("amount_received").asLong());
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // HTTP helpers
  // ---------------------------------------------------------------------------

  private String post(String path, String formBody, String op) {
    try {
      return restClient.post()
        .uri(path)
        .header("Authorization", bearer())
        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
        .body(formBody)
        .retrieve()
        .body(String.class);
    } catch (RestClientResponseException ex) {
      // Mirror Node: surface the provider HTTP status; never swallow.
      throw new IllegalStateException(
        "Stripe " + op + " failed (HTTP " + ex.getStatusCode().value() + ")", ex);
    } catch (RuntimeException ex) {
      throw new IllegalStateException("Stripe " + op + " failed: transport error", ex);
    }
  }

  private JsonNode readTree(String body, String op) {
    try {
      return objectMapper.readTree(body == null ? "{}" : body);
    } catch (Exception ex) {
      throw new IllegalStateException("Stripe " + op + " returned an unparseable response", ex);
    }
  }

  private String bearer() {
    return "Bearer " + config.getSecretKey();
  }

  private void requireSecretKey() {
    if (config.getSecretKey() == null || config.getSecretKey().isBlank()) {
      throw new IllegalStateException("Stripe secretKey is not configured");
    }
  }

  // ---------------------------------------------------------------------------
  // crypto + encoding helpers (port of base.js)
  // ---------------------------------------------------------------------------

  /** HMAC-SHA256 -> lower-case hex. Refuses an empty key (base.js:hmacSha256Hex). */
  private static String hmacSha256Hex(String data, String secret) {
    if (secret == null || secret.isEmpty()) {
      throw new IllegalArgumentException("hmacSha256Hex: secret must be a non-empty string");
    }
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
      byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      return toHex(digest);
    } catch (GeneralSecurityException ex) {
      throw new IllegalStateException("Failed to compute HMAC-SHA256", ex);
    }
  }

  private static String toHex(byte[] bytes) {
    StringBuilder sb = new StringBuilder(bytes.length * 2);
    for (byte b : bytes) {
      sb.append(Character.forDigit((b >> 4) & 0xF, 16));
      sb.append(Character.forDigit(b & 0xF, 16));
    }
    return sb.toString();
  }

  /** Constant-time comparison over UTF-8 bytes (base.js:timingSafeEqual). */
  private static boolean constantTimeEquals(String a, String b) {
    byte[] ba = (a == null ? "" : a).getBytes(StandardCharsets.UTF_8);
    byte[] bb = (b == null ? "" : b).getBytes(StandardCharsets.UTF_8);
    return MessageDigest.isEqual(ba, bb);
  }

  private static long nowSeconds() {
    return System.currentTimeMillis() / 1000L;
  }

  private static long toMinorUnits(BigDecimal amount) {
    if (amount == null) {
      throw new IllegalArgumentException("amount (minor units) is required");
    }
    return amount.toBigIntegerExact().longValueExact();
  }

  private static String formEncode(String value) {
    return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  /** Encode a value used as a URL path segment (Stripe ids are alnum + '_', but stay defensive). */
  private static String formEncodePathSegment(String value) {
    return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
  }

  private static String jsonEscape(String value) {
    return value.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  // ---------------------------------------------------------------------------
  // signature-header parsing (stripe.js:parseSigHeader)
  // ---------------------------------------------------------------------------

  private record SignatureHeader(String timestamp, List<String> signatures) {}

  private static SignatureHeader parseSignatureHeader(String header) {
    String timestamp = null;
    List<String> v1 = new ArrayList<>();
    for (String part : header.split(",")) {
      int eq = part.indexOf('=');
      if (eq < 0) {
        continue;
      }
      String key = part.substring(0, eq).trim();
      String val = part.substring(eq + 1).trim();
      if ("t".equals(key)) {
        timestamp = val;
      } else if ("v1".equals(key)) {
        v1.add(val);
      }
    }
    return new SignatureHeader(timestamp, v1);
  }

  // ---------------------------------------------------------------------------
  // misc small helpers
  // ---------------------------------------------------------------------------

  private static String caseInsensitiveHeader(Map<String, String> headers, String name) {
    String direct = headers.get(name);
    if (direct != null) {
      return direct;
    }
    for (Map.Entry<String, String> entry : headers.entrySet()) {
      if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) {
        return entry.getValue();
      }
    }
    return null;
  }

  private static String secretOrDefault(String secret, String fallback) {
    return (secret == null || secret.isBlank()) ? fallback : secret;
  }

  private String publishableOrDefault() {
    String pk = config.getPublishableKey();
    return (pk == null || pk.isBlank()) ? "pk_test_mock" : pk;
  }

  private static String textOrNull(JsonNode node, String field) {
    JsonNode value = node.get(field);
    return (value == null || value.isNull()) ? null : value.asText();
  }

  private static String textOrEmpty(JsonNode node, String field) {
    String value = textOrNull(node, field);
    return value == null ? "" : value;
  }
}
