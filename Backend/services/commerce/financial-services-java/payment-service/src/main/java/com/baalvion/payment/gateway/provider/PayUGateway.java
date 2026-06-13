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
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * PayU (India) PSP adapter — faithful port of Node {@code gateway/adapters/payu.js}.
 *
 * <p>PayU is a <strong>redirect/post</strong> flow: there is NO server-to-server API call to
 * create a charge. {@link #initiate} generates a deterministic {@code txnid} and a SHA-512
 * <em>request</em> hash over the PayU field sequence; the browser then form-POSTs those
 * params to PayU. Money settles via a form-encoded webhook (no API capture/refund/status
 * endpoint is exposed by PayU here), so {@link #capture}, {@link #refund} and
 * {@link #fetchStatus} are intentionally unsupported — exactly as the Node module exports
 * only {@code createOrder}/{@code verifyWebhook}/{@code parseWebhook} for PayU.
 *
 * <p>Request hash (Node {@code requestHash}):
 * {@code sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)} — amount in
 * MAJOR units (e.g. {@code "10.00"}).
 *
 * <p>Webhook verification (Node {@code verifyWebhook}) uses a SHA-512 <em>reverse</em> hash —
 * there is no signature header — over the posted form fields:
 * {@code sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)},
 * constant-time compared to the body's {@code hash} field. Status map: {@code success →
 * CAPTURED}, {@code failure|failed → FAILED}, {@code refunded → REFUNDED}, otherwise FAILED.
 *
 * <p>Secrets ({@code merchantKey}, {@code merchantSalt}) come from the injected
 * {@link PspProperties.Payu} (env-bound at deploy; never hardcoded).
 */
@Component
public class PayUGateway implements PaymentGateway {

  static final String PROVIDER = "payu";

  /** PayU amounts are MAJOR units (rupees); the SPI carries MINOR units (paise). */
  private static final BigDecimal MINOR_PER_MAJOR = new BigDecimal("100");
  private static final String DEFAULT_FIRSTNAME = "customer";
  private static final String DEFAULT_EMAIL = "customer@baalvion.test";
  private static final String DEFAULT_PRODUCTINFO = "baalvion-order";
  private static final String DEFAULT_CURRENCY = "INR";
  /** txnid hash slice length (payu.js:38: {@code .slice(0, 16)}). */
  private static final int TXNID_HASH_LEN = 16;

  private final PspProperties.Payu config;
  private final boolean mock;

  public PayUGateway(PspProperties properties) {
    this.config = properties.getPayu();
    this.mock = properties.isMock();
  }

  @Override
  public String name() {
    return PROVIDER;
  }

  /**
   * Build the PayU redirect/post params. No HTTP call (mock and live are identical here —
   * only the {@code raw.mocked} flag and the {@code txnid} prefix differ). Returns a
   * {@link GatewayStatus#CREATED} charge: the order exists, awaiting the customer redirect.
   */
  @Override
  public GatewayChargeResponse initiate(GatewayChargeRequest request) {
    Objects.requireNonNull(request, "charge request is required");
    String key = requireSecret(config == null ? null : config.getMerchantKey(), "PayU merchantKey");
    String salt = requireSecret(config == null ? null : config.getMerchantSalt(), "PayU merchantSalt");

    BigDecimal minorAmount = request.amount();
    if (minorAmount == null || minorAmount.signum() <= 0) {
      throw new IllegalArgumentException("PayU charge amount must be a positive minor-unit value");
    }
    // PayU uses major units: (amount / 100).toFixed(2)  (payu.js:37).
    String amountMajor = minorAmount.divide(MINOR_PER_MAJOR, 2, RoundingMode.HALF_UP).toPlainString();

    String currency = request.currency() == null || request.currency().isBlank()
      ? DEFAULT_CURRENCY
      : request.currency();
    String productinfo = request.orderRef() == null || request.orderRef().isBlank()
      ? DEFAULT_PRODUCTINFO
      : request.orderRef();

    Map<String, String> customer = request.customer();
    String firstname = customerValue(customer, "firstname", DEFAULT_FIRSTNAME);
    String email = customerValue(customer, "email", DEFAULT_EMAIL);

    // Deterministic txnid: 'txn_' + (live ? '' : 'mock_') + sha512(receipt:amount:currency)[0..16]
    // NOTE: the Node hash basis uses the MINOR amount (payu.js:38), not the major string.
    String receipt = request.orderRef() == null ? "" : request.orderRef();
    String txnSeed = receipt + ":" + minorAmount.toPlainString() + ":" + currency;
    String txnid = "txn_" + (mock ? "mock_" : "") + sha512Hex(txnSeed).substring(0, TXNID_HASH_LEN);

    String hash = requestHash(key, txnid, amountMajor, productinfo, firstname, email, salt);

    // clientParams mirror payu.js:45 — non-secret values the client form-POSTs to PayU.
    Map<String, String> clientParams = new LinkedHashMap<>();
    clientParams.put("key", key);
    clientParams.put("txnid", txnid);
    clientParams.put("amount", amountMajor);
    clientParams.put("productinfo", productinfo);
    clientParams.put("firstname", firstname);
    clientParams.put("email", email);
    clientParams.put("hash", hash);
    clientParams.put("currency", currency);

    String rawResponse = "{\"mocked\":" + mock + "}";

    return new GatewayChargeResponse(PROVIDER, txnid, GatewayStatus.CREATED, clientParams, rawResponse);
  }

  /**
   * Unsupported: PayU has no server-side capture API in this flow. Funds are confirmed by the
   * form-encoded webhook ({@code status=success} → CAPTURED), applied via
   * {@link #verifyAndParseWebhook}. Mirrors the Node module exporting no capture call.
   */
  @Override
  public GatewayChargeResponse capture(String providerRef) {
    throw new UnsupportedOperationException(
      "PayU does not support an explicit capture call; capture is confirmed via the success webhook");
  }

  /**
   * Unsupported: the Node {@code payu.js} module exports no {@code refund()} (only Razorpay and
   * Stripe do). PayU refunds are handled out-of-band via the PayU dashboard / a separate
   * integration not exposed through this SPI.
   */
  @Override
  public RefundResult refund(RefundRequest request) {
    throw new UnsupportedOperationException(
      "PayU refunds are out-of-band (PayU dashboard); no in-band refund is exposed by this adapter");
  }

  /**
   * Unsupported: PayU exposes no status-fetch API in this redirect/post flow. Charge status is
   * driven exclusively by the inbound webhook.
   */
  @Override
  public GatewayChargeResponse fetchStatus(String providerRef) {
    throw new UnsupportedOperationException(
      "PayU does not expose a status-fetch API; status is driven by the inbound webhook");
  }

  /**
   * Verify and parse a PayU webhook. PayU posts form-encoded fields (NOT JSON) and carries no
   * signature header — verification is the SHA-512 reverse hash recomputed over the posted
   * fields and constant-time compared to the body's {@code hash} (payu.js:50-63). On mismatch
   * or missing hash/secrets this throws {@link WebhookVerificationException}; a returned
   * {@link WebhookResult} therefore always represents an authenticated event.
   */
  @Override
  public WebhookResult verifyAndParseWebhook(byte[] rawBody, Map<String, String> headers) {
    if (rawBody == null || rawBody.length == 0) {
      throw new WebhookVerificationException("PayU webhook body is empty");
    }
    String key = config == null ? null : config.getMerchantKey();
    String salt = config == null ? null : config.getMerchantSalt();
    if (isBlank(key) || isBlank(salt)) {
      throw new WebhookVerificationException("PayU merchant secrets are not configured");
    }

    Map<String, String> body = parseFormBody(rawBody);
    String suppliedHash = body.get("hash");
    if (isBlank(suppliedHash)) {
      throw new WebhookVerificationException("PayU webhook is missing the hash field");
    }

    // Reverse hash over the posted fields (payu.js:30). Absent fields hash as empty strings,
    // exactly as Node's template-literal interpolation of undefined → '' would after coercion.
    String expected = responseHash(
      salt,
      orEmpty(body.get("status")),
      orEmpty(body.get("email")),
      orEmpty(body.get("firstname")),
      orEmpty(body.get("productinfo")),
      orEmpty(body.get("amount")),
      orEmpty(body.get("txnid")),
      key);

    if (!constantTimeEquals(suppliedHash, expected)) {
      throw new WebhookVerificationException("PayU webhook hash verification failed");
    }

    return parseWebhook(body);
  }

  // ---------------------------------------------------------------------------------------------
  // Parsing / mapping (faithful to payu.js parseWebhook / mapStatus)
  // ---------------------------------------------------------------------------------------------

  private WebhookResult parseWebhook(Map<String, String> body) {
    String rawStatus = orEmpty(body.get("status"));
    GatewayStatus status = mapStatus(rawStatus);
    String canonical = canonicalStatusToken(status); // 'captured' | 'failed' | 'refunded'

    BigDecimal amountMinor = toMinorAmount(body.get("amount"));

    String txnid = body.get("txnid");
    String mihpayid = body.get("mihpayid");
    // providerEventId: mihpayid OR (txnid ? `${txnid}:${status}` : null)  (payu.js:74).
    String providerEventId;
    if (!isBlank(mihpayid)) {
      providerEventId = mihpayid;
    } else if (!isBlank(txnid)) {
      providerEventId = txnid + ":" + rawStatus;
    } else {
      providerEventId = null;
    }

    String providerRef = isBlank(txnid) ? null : txnid;
    String eventType = "payment." + canonical;

    // payload mirrors the Node `raw: body` — the full parsed form for ledger/audit.
    Map<String, Object> payload = new LinkedHashMap<>(body);

    return new WebhookResult(PROVIDER, providerRef, providerEventId, eventType, status, amountMinor, payload);
  }

  /** payu.js mapStatus: success→captured, failure|failed→failed, refunded→refunded, else failed. */
  private static GatewayStatus mapStatus(String status) {
    String s = status == null ? "" : status.toLowerCase(Locale.ROOT);
    return switch (s) {
      case "success" -> GatewayStatus.CAPTURED;
      case "refunded" -> GatewayStatus.REFUNDED;
      case "failure", "failed" -> GatewayStatus.FAILED;
      default -> GatewayStatus.FAILED;
    };
  }

  /** Canonical lowercase token used in the Node {@code eventType} (`payment.<token>`). */
  private static String canonicalStatusToken(GatewayStatus status) {
    return switch (status) {
      case CAPTURED -> "captured";
      case REFUNDED -> "refunded";
      case FAILED -> "failed";
      // PayU only emits captured/failed/refunded; map any defensive others sensibly.
      case AUTHORIZED -> "authorized";
      case CREATED -> "created";
    };
  }

  /**
   * Convert PayU's major-unit amount string back to MINOR units, guarding malformed/locale
   * values to {@code null} (payu.js:69-70: {@code Number.isFinite ? Math.round(*100) : null}).
   */
  private static BigDecimal toMinorAmount(String amount) {
    if (amount == null || amount.isBlank()) {
      return null;
    }
    try {
      double parsed = Double.parseDouble(amount.trim());
      if (!Double.isFinite(parsed)) {
        return null;
      }
      // Math.round(parsed * 100) — half-up rounding to a whole minor-unit count.
      long minor = Math.round(parsed * 100.0d);
      return BigDecimal.valueOf(minor);
    } catch (NumberFormatException ex) {
      // Locale-formatted / non-numeric amount → null (avoid NaN reaching a NUMERIC column).
      return null;
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Hashing (SHA-512 hex; matches Node sha512Hex)
  // ---------------------------------------------------------------------------------------------

  /** sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt). */
  private static String requestHash(String key, String txnid, String amount, String productinfo,
                                    String firstname, String email, String salt) {
    String seq = key + "|" + txnid + "|" + amount + "|" + productinfo + "|" + firstname + "|"
      + email + "|||||||||||" + salt;
    return sha512Hex(seq);
  }

  /** sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key). */
  private static String responseHash(String salt, String status, String email, String firstname,
                                     String productinfo, String amount, String txnid, String key) {
    String seq = salt + "|" + status + "|||||||||||" + email + "|" + firstname + "|" + productinfo
      + "|" + amount + "|" + txnid + "|" + key;
    return sha512Hex(seq);
  }

  private static String sha512Hex(String data) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-512");
      byte[] hashed = digest.digest(data.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hashed);
    } catch (NoSuchAlgorithmException e) {
      // SHA-512 is mandated by every JRE; if absent the platform is unusable.
      throw new IllegalStateException("SHA-512 is not available in this JVM", e);
    }
  }

  /**
   * Constant-time comparison of two hex hash strings (Node {@code timingSafeEqual}): length
   * mismatch is rejected first, then a time-constant byte compare. {@link MessageDigest#isEqual}
   * is constant-time in modern JDKs.
   */
  private static boolean constantTimeEquals(String a, String b) {
    byte[] ba = (a == null ? "" : a).getBytes(StandardCharsets.UTF_8);
    byte[] bb = (b == null ? "" : b).getBytes(StandardCharsets.UTF_8);
    if (ba.length != bb.length) {
      return false;
    }
    return MessageDigest.isEqual(ba, bb);
  }

  // ---------------------------------------------------------------------------------------------
  // Form-body parsing + small helpers
  // ---------------------------------------------------------------------------------------------

  /**
   * Parse an {@code application/x-www-form-urlencoded} body into a field map. Later duplicate
   * keys overwrite earlier ones (last-wins), matching how a parsed form object collapses repeats.
   */
  private static Map<String, String> parseFormBody(byte[] rawBody) {
    String raw = new String(rawBody, StandardCharsets.UTF_8).trim();
    Map<String, String> fields = new LinkedHashMap<>();
    if (raw.isEmpty()) {
      return fields;
    }
    for (String pair : raw.split("&")) {
      if (pair.isEmpty()) {
        continue;
      }
      int eq = pair.indexOf('=');
      String name = eq >= 0 ? pair.substring(0, eq) : pair;
      String value = eq >= 0 ? pair.substring(eq + 1) : "";
      fields.put(urlDecode(name), urlDecode(value));
    }
    return fields;
  }

  private static String urlDecode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }

  private static String customerValue(Map<String, String> customer, String field, String fallback) {
    if (customer == null) {
      return fallback;
    }
    String value = customer.get(field);
    return isBlank(value) ? fallback : value;
  }

  private static String requireSecret(String value, String label) {
    if (isBlank(value)) {
      throw new IllegalStateException(label + " is not configured");
    }
    return value;
  }

  private static String orEmpty(String value) {
    return value == null ? "" : value;
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
