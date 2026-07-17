package com.baalvion.payment.gateway.provider;

import com.baalvion.payment.gateway.config.PspProperties;
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
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Crypto (USDT-TRC20 / ETH-BEP20 / BTC) PSP adapter — NON-CUSTODIAL. Unlike Razorpay/Stripe/
 * PayU, there is no live merchant account to call: {@code initiate} hands out the merchant's
 * OWN fixed, pre-configured receiving address (never generated/derived here — see
 * {@link PspProperties.Crypto}'s javadoc) plus a tagged target amount, and NOTHING is
 * automatically confirmed by a provider webhook, because a self-custodied wallet has no
 * webhook to send one. Confirmation instead comes from {@link com.baalvion.payment.gateway.service.CryptoChainPoller},
 * which polls a public block explorer and — on a match — calls this class's
 * {@link #checkForPayment} then feeds the result into the exact same
 * {@code GatewayService.applyWebhook} pipeline every other provider uses.
 *
 * <p>USDT-TRC20 is a stablecoin (flat 1:1 USD peg, no rate lookup needed); BTC and ETH-BEP20
 * (Binance-Peg Ethereum Token) both track a volatile market price, so both go through a live
 * USD-rate lookup at charge-creation time (see {@link #btcUsdRate}/{@link #ethUsdRate}), with
 * the rate used stored in {@code rawResponse} so the SAME rate is used to convert the confirmed
 * on-chain amount back to cents later (never re-fetched, which would drift from the amount the
 * payer was actually shown).
 *
 * <p><b>Amount-tagging:</b> since many charges can share the SAME address (there is only one
 * merchant wallet, not one address per order), each charge's on-chain target amount gets a
 * tiny deterministic offset (a handful of the smallest unit — negligible value) derived from
 * the order ref, so concurrent charges are individually distinguishable on-chain. The tag is
 * stored in {@code rawResponse} and subtracted back out when converting a confirmed on-chain
 * amount back to the USD-cents unit {@code GatewayService} validates against.
 *
 * <p>⚠ VERIFY AT EXECUTION TIME: {@link #tronGridTransfers}, {@link #bep20Transfers}, and
 * {@link #mempoolAddressTxs}/{@link #mempoolTipHeight} parse TronGrid's, BSC's EVM JSON-RPC,
 * and mempool.space's PUBLICLY DOCUMENTED response shapes as of their current API versions —
 * not confirmed against a live call from this development environment (no outbound network
 * access here). Confirm field names against a real response before relying on this in
 * production; this is the ONE place that risk lives.
 */
@Slf4j
@Component
public class CryptoGateway implements PaymentGateway {

  static final String PROVIDER = "crypto";
  static final String ASSET_USDT_TRC20 = "USDT_TRC20";
  /** Binance-Peg Ethereum Token — a BEP20 (BSC) token tracking ETH/USD, NOT a stablecoin like
   *  USDT: it needs a live rate lookup at charge time, same as BTC (see {@link #ethUsdRate}). */
  static final String ASSET_ETH_BEP20 = "ETH_BEP20";
  static final String ASSET_BTC = "BTC";
  /** keccak256("Transfer(address,address,uint256)") — the ERC20/BEP20 Transfer event's topic0
   *  (BSC is EVM-compatible, same event ABI as Ethereum) — a fixed constant, never derived. */
  private static final String TRANSFER_EVENT_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  /** 1 USDT == 1,000,000 microUSDT; 1 USD cent == 1/100 USD == 10,000 microUSDT. */
  private static final long MICRO_USDT_PER_CENT = 10_000L;
  /** Tagging offset range in the target asset's smallest unit — a few units, negligible value. */
  private static final long TAG_MODULUS = 1000L;

  private final PspProperties.Crypto config;
  private final ObjectMapper objectMapper;
  private final RestClient restClient;

  public CryptoGateway(PspProperties properties, ObjectMapper objectMapper) {
    this.config = properties.getCrypto();
    this.objectMapper = objectMapper;
    this.restClient = RestClient.builder().build();
  }

  @Override
  public String name() {
    return PROVIDER;
  }

  // ---------------------------------------------------------------------------
  // initiate — assign the merchant's own address + a tagged target amount
  // ---------------------------------------------------------------------------

  @Override
  public GatewayChargeResponse initiate(GatewayChargeRequest request, ProviderConfig cfg) {
    Objects.requireNonNull(request, "charge request must not be null");
    Objects.requireNonNull(cfg, "config");

    String asset = assetOf(request);
    long amountCents = request.amount().longValueExact();
    long tagSmallestUnit = taggingOffset(request.orderRef(), asset);

    String address;
    long targetSmallestUnit;
    BigDecimal usdRateUsed = null;

    if (ASSET_USDT_TRC20.equals(asset)) {
      address = requireAddress(cfg.configString("usdtTrc20Address"), config.getUsdtTrc20Address(), "USDT-TRC20");
      targetSmallestUnit = amountCents * MICRO_USDT_PER_CENT + tagSmallestUnit;
    } else if (ASSET_ETH_BEP20.equals(asset)) {
      address = requireAddress(cfg.configString("ethBep20Address"), config.getEthBep20Address(), "ETH-BEP20");
      usdRateUsed = ethUsdRate(cfg.mock());
      targetSmallestUnit = usdToSmallestUnit(amountCents, usdRateUsed, 18) + tagSmallestUnit;
    } else if (ASSET_BTC.equals(asset)) {
      address = requireAddress(cfg.configString("btcAddress"), config.getBtcAddress(), "BTC");
      usdRateUsed = btcUsdRate(cfg.mock());
      targetSmallestUnit = usdToSmallestUnit(amountCents, usdRateUsed, 8) + tagSmallestUnit;
    } else {
      throw new IllegalArgumentException("Unsupported cryptoAsset (expected USDT_TRC20, ETH_BEP20, or BTC): " + asset);
    }

    String providerRef = "crypto_" + UUID.randomUUID();
    Instant expiresAt = Instant.now().plusSeconds(config.getChargeExpiryMinutes() * 60);

    Map<String, Object> raw = new LinkedHashMap<>();
    raw.put("asset", asset);
    raw.put("network", networkOf(asset));
    raw.put("address", address);
    raw.put("targetSmallestUnit", targetSmallestUnit);
    raw.put("taggingOffsetSmallestUnit", tagSmallestUnit);
    raw.put("amountCents", amountCents);
    if (usdRateUsed != null) {
      raw.put("usdRateUsed", usdRateUsed.toPlainString());
    }
    raw.put("createdAt", Instant.now().toString());
    raw.put("expiresAt", expiresAt.toString());
    raw.put("mock", cfg.mock());

    Map<String, String> clientParams = new LinkedHashMap<>();
    clientParams.put("asset", asset);
    clientParams.put("network", (String) raw.get("network"));
    clientParams.put("address", address);
    // Raw numeric amount (no unit suffix) — lets the client build a BIP21 URI ("bitcoin:<addr>?
    // amount=<amountValue>") for QR codes that pre-fill the amount in the paying wallet, not just
    // amountDisplay's human-readable "0.00081235 BTC" string.
    clientParams.put("amountValue", amountValue(asset, targetSmallestUnit));
    clientParams.put("amountDisplay", displayAmount(asset, targetSmallestUnit));
    clientParams.put("expiresAt", expiresAt.toString());

    return new GatewayChargeResponse(PROVIDER, providerRef, GatewayStatus.CREATED, clientParams, toJson(raw));
  }

  // ---------------------------------------------------------------------------
  // capture / refund — no live merchant call exists for a self-custodied wallet
  // ---------------------------------------------------------------------------

  @Override
  public GatewayChargeResponse capture(String providerRef, ProviderConfig cfg) {
    // Confirmation only ever arrives via CryptoChainPoller -> GatewayService.applyWebhook;
    // there is no separate capture step. Report CREATED — the caller should read the charge's
    // current persisted status instead of expecting a live re-check here (see class javadoc).
    return new GatewayChargeResponse(PROVIDER, providerRef, GatewayStatus.CREATED, Map.of(), "{}");
  }

  @Override
  public RefundResult refund(RefundRequest request, ProviderConfig cfg) {
    // No automated on-chain refund path exists (would require the customer's OWN receiving
    // address, which this flow never collects) — same "no in-band refund" shape as PayU.
    // Refunds for crypto charges are a manual, out-of-band operation.
    throw new UnsupportedOperationException(
      "Crypto charges have no automated refund path — refund manually to the customer's own address");
  }

  @Override
  public GatewayChargeResponse fetchStatus(String providerRef, ProviderConfig cfg) {
    // Same reasoning as capture(): the adapter alone (providerRef + config) cannot re-derive the
    // target address/amount without the persisted GatewayPayment.rawResponse, which only
    // CryptoChainPoller has access to. This exists to satisfy the interface; real status checks
    // go through the poller.
    return new GatewayChargeResponse(PROVIDER, providerRef, GatewayStatus.CREATED, Map.of(), "{}");
  }

  @Override
  public WebhookResult verifyAndParseWebhook(byte[] rawBody, Map<String, String> headers, ProviderConfig cfg) {
    // There is no externally-reachable crypto webhook endpoint (see class javadoc) — this
    // provider's "webhook" is always internally synthesized by CryptoChainPoller and applied
    // via GatewayService.applyWebhook directly. Reaching this method means something tried to
    // POST to /v1/gateway/webhooks/crypto from outside the process, which must never succeed.
    throw new UnsupportedOperationException(
      "crypto has no external webhook endpoint — confirmations are polled, not pushed");
  }

  // ---------------------------------------------------------------------------
  // Chain-watching (called by CryptoChainPoller, which owns persistence access)
  // ---------------------------------------------------------------------------

  public record ChainMatch(String txHash, long confirmedSmallestUnit, int confirmations) {}

  /**
   * Check whether {@code address} has received a not-yet-consumed transfer of at least
   * {@code targetSmallestUnit} since {@code since}. Exact-match dedup against already-applied
   * events is the CALLER's job (via {@code GatewayWebhookEventRepository}'s existing
   * provider+eventId uniqueness, keyed by this method's returned {@code txHash}) — this method
   * only looks at the chain.
   */
  public Optional<ChainMatch> checkForPayment(String asset, String address, long targetSmallestUnit, Instant since, ProviderConfig cfg) {
    if (cfg.mock()) {
      // Deterministic mock "confirmation": once the charge is at least 5 seconds old, treat it
      // as paid — good enough for local/dev exercising of the full poller -> webhook -> fulfill
      // pipeline without any live chain calls.
      if (since != null && Instant.now().isAfter(since.plusSeconds(5))) {
        String fakeTx = "mock_" + sha256Hex(address + ":" + targetSmallestUnit).substring(0, 24);
        return Optional.of(new ChainMatch(fakeTx, targetSmallestUnit, 99));
      }
      return Optional.empty();
    }
    return switch (asset) {
      case ASSET_USDT_TRC20 -> tronGridTransfers(address, targetSmallestUnit);
      case ASSET_ETH_BEP20 -> bep20Transfers(address, targetSmallestUnit);
      default -> mempoolAddressTxs(address, targetSmallestUnit);
    };
  }

  /** Converts a confirmed on-chain amount + this charge's stored tagging offset back to USD cents. */
  public long confirmedAmountToCents(String asset, long confirmedSmallestUnit, long taggingOffsetSmallestUnit, BigDecimal usdRateUsed) {
    long untagged = confirmedSmallestUnit - taggingOffsetSmallestUnit;
    if (ASSET_USDT_TRC20.equals(asset)) {
      return untagged / MICRO_USDT_PER_CENT;
    }
    Objects.requireNonNull(usdRateUsed, "usdRateUsed is required to convert a BTC/ETH amount back to cents");
    int decimals = ASSET_ETH_BEP20.equals(asset) ? 18 : 8;
    BigDecimal whole = BigDecimal.valueOf(untagged).movePointLeft(decimals);
    return whole.multiply(usdRateUsed).movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
  }

  // ---------------------------------------------------------------------------
  // TronGrid (USDT-TRC20)
  // ---------------------------------------------------------------------------

  private Optional<ChainMatch> tronGridTransfers(String address, long targetSmallestUnit) {
    String url = config.getTronGridBaseUrl() + "/v1/accounts/" + address
      + "/transactions/trc20?limit=50&contract_address=" + config.getUsdtTrc20ContractAddress();
    String body;
    try {
      body = restClient.get().uri(url).retrieve().body(String.class);
    } catch (RuntimeException ex) {
      log.warn("TronGrid lookup failed for address={}: {}", sanitize(address), ex.getMessage());
      return Optional.empty();
    }
    JsonNode root = readTree(body);
    for (JsonNode tx : root.path("data")) {
      if (!address.equalsIgnoreCase(textOrEmpty(tx, "to"))) {
        continue;
      }
      long value = tx.path("value").asLong(-1);
      if (value < targetSmallestUnit) {
        continue;
      }
      String txHash = textOrEmpty(tx, "transaction_id");
      if (txHash.isEmpty()) {
        continue;
      }
      return Optional.of(new ChainMatch(txHash, value, 99));
    }
    return Optional.empty();
  }

  // ---------------------------------------------------------------------------
  // BNB Smart Chain public JSON-RPC (ETH-BEP20) — eth_getLogs on the Transfer event.
  // BSC is EVM-compatible (same JSON-RPC methods/log format as Ethereum), so this is the
  // exact same technique, just pointed at BSC's RPC + the Binance-Peg ETH token contract.
  // ---------------------------------------------------------------------------

  /**
   * ⚠ VERIFY AT EXECUTION TIME (see class javadoc): decodes raw JSON-RPC {@code eth_getLogs}
   * results by hand (no web3/ethers dependency) — topic0 is the fixed Transfer event
   * signature, topic2 is the recipient address (32-byte, zero-left-padded), and {@code data}
   * is the raw uint256 transfer amount as hex. Queries only the last ~1500 blocks (~75 min at
   * BSC's ~3s/block — comfortably covers {@code chargeExpiryMinutes}) to keep the request cheap
   * enough for a public, unauthenticated RPC endpoint.
   */
  private Optional<ChainMatch> bep20Transfers(String address, long targetSmallestUnit) {
    Long latestBlock = evmBlockNumber(config.getBscRpcUrl());
    if (latestBlock == null) {
      return Optional.empty();
    }
    long fromBlock = Math.max(0, latestBlock - 1500);
    String paddedAddress = "0x" + "0".repeat(24) + address.toLowerCase(Locale.ROOT).replaceFirst("^0x", "");

    Map<String, Object> filter = new LinkedHashMap<>();
    filter.put("fromBlock", "0x" + Long.toHexString(fromBlock));
    filter.put("toBlock", "latest");
    filter.put("address", config.getEthBep20ContractAddress());
    // Arrays.asList (NOT List.of) — List.of throws NullPointerException on a null element, and
    // the middle topic slot (topic1 = sender, unfiltered) must be null per eth_getLogs' convention.
    filter.put("topics", java.util.Arrays.asList(TRANSFER_EVENT_TOPIC, null, paddedAddress));

    JsonNode result = evmRpcCall(config.getBscRpcUrl(), "eth_getLogs", java.util.List.of(filter));
    if (result == null) {
      return Optional.empty();
    }
    for (JsonNode log0 : result) {
      long value = hexToLong(textOrEmpty(log0, "data"));
      if (value < targetSmallestUnit) {
        continue;
      }
      long logBlock = hexToLong(textOrEmpty(log0, "blockNumber"));
      int confirmations = (int) Math.max(0, latestBlock - logBlock + 1);
      if (confirmations < config.getBscConfirmationsRequired()) {
        continue;
      }
      String txHash = textOrEmpty(log0, "transactionHash");
      if (txHash.isEmpty()) {
        continue;
      }
      return Optional.of(new ChainMatch(txHash, value, confirmations));
    }
    return Optional.empty();
  }

  private Long evmBlockNumber(String rpcUrl) {
    JsonNode result = evmRpcCall(rpcUrl, "eth_blockNumber", java.util.List.of());
    if (result == null || !result.isTextual()) {
      return null;
    }
    return hexToLong(result.asText());
  }

  /** Minimal JSON-RPC 2.0 client — no web3/ethers dependency, see method javadoc above. Works
   *  against any EVM-compatible chain (Ethereum, BSC, …) given that chain's RPC URL. */
  private JsonNode evmRpcCall(String rpcUrl, String method, java.util.List<Object> params) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("jsonrpc", "2.0");
    body.put("id", 1);
    body.put("method", method);
    body.put("params", params);
    try {
      String responseBody = restClient.post()
        .uri(rpcUrl)
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .body(objectMapper.writeValueAsString(body))
        .retrieve().body(String.class);
      JsonNode root = readTree(responseBody);
      if (root.has("error")) {
        log.warn("EVM RPC {} returned an error: {}", method, root.path("error").toString());
        return null;
      }
      return root.get("result");
    } catch (RuntimeException | com.fasterxml.jackson.core.JsonProcessingException ex) {
      log.warn("EVM RPC {} call failed: {}", method, ex.getMessage());
      return null;
    }
  }

  private static long hexToLong(String hex) {
    if (hex == null || hex.isBlank()) {
      return 0L;
    }
    String h = hex.startsWith("0x") || hex.startsWith("0X") ? hex.substring(2) : hex;
    if (h.isEmpty()) {
      return 0L;
    }
    // Fits comfortably in a long for any realistic charge amount at THIS platform's price points
    // ($100-$250 tiers): even 18-decimal ETH-BEP20 wei amounts stay well under long's ~9.22e18
    // max for any plausible ETH/USD rate. Would need BigInteger instead if amounts/decimals ever
    // grow enough to risk overflow. Long.parseUnsignedLong tolerates the full unsigned 64-bit
    // range (this also parses block numbers, which are far smaller).
    return Long.parseUnsignedLong(h, 16);
  }

  // ---------------------------------------------------------------------------
  // mempool.space (BTC)
  // ---------------------------------------------------------------------------

  private Optional<ChainMatch> mempoolAddressTxs(String address, long targetSats) {
    String body;
    try {
      body = restClient.get().uri(config.getMempoolBaseUrl() + "/address/" + address + "/txs")
        .retrieve().body(String.class);
    } catch (RuntimeException ex) {
      log.warn("mempool.space lookup failed for address={}: {}", sanitize(address), ex.getMessage());
      return Optional.empty();
    }
    int tipHeight = mempoolTipHeight();
    JsonNode root = readTree(body);
    for (JsonNode tx : root) {
      JsonNode status = tx.path("status");
      if (!status.path("confirmed").asBoolean(false)) {
        continue;
      }
      int blockHeight = status.path("block_height").asInt(-1);
      int confirmations = blockHeight < 0 || tipHeight < 0 ? 0 : (tipHeight - blockHeight + 1);
      if (confirmations < config.getBtcConfirmationsRequired()) {
        continue;
      }
      for (JsonNode vout : tx.path("vout")) {
        if (!address.equalsIgnoreCase(textOrEmpty(vout, "scriptpubkey_address"))) {
          continue;
        }
        long value = vout.path("value").asLong(-1);
        if (value < targetSats) {
          continue;
        }
        String txHash = textOrEmpty(tx, "txid");
        if (txHash.isEmpty()) {
          continue;
        }
        return Optional.of(new ChainMatch(txHash, value, confirmations));
      }
    }
    return Optional.empty();
  }

  private int mempoolTipHeight() {
    try {
      String body = restClient.get().uri(config.getMempoolBaseUrl() + "/blocks/tip/height")
        .retrieve().body(String.class);
      return body == null ? -1 : Integer.parseInt(body.trim());
    } catch (RuntimeException ex) {
      log.warn("mempool.space tip-height lookup failed: {}", ex.getMessage());
      return -1;
    }
  }

  private BigDecimal btcUsdRate(boolean mock) {
    return mock ? BigDecimal.valueOf(60000) : coinGeckoUsdRate("bitcoin");
  }

  private BigDecimal ethUsdRate(boolean mock) {
    return mock ? BigDecimal.valueOf(3000) : coinGeckoUsdRate("ethereum");
  }

  private BigDecimal coinGeckoUsdRate(String coinGeckoId) {
    try {
      String body = restClient.get()
        .uri(config.getRateApiBaseUrl() + "/simple/price?ids=" + coinGeckoId + "&vs_currencies=usd")
        .retrieve().body(String.class);
      JsonNode root = readTree(body);
      double rate = root.path(coinGeckoId).path("usd").asDouble(-1);
      if (rate <= 0) {
        throw new IllegalStateException("coingecko returned no usable " + coinGeckoId + "/USD rate");
      }
      return BigDecimal.valueOf(rate);
    } catch (RuntimeException ex) {
      throw new IllegalStateException("Failed to fetch " + coinGeckoId + "/USD rate: " + ex.getMessage(), ex);
    }
  }

  /** USD (in cents) -> the asset's smallest unit, at the given USD rate, rounded to a whole unit. */
  private static long usdToSmallestUnit(long amountCents, BigDecimal usdRate, int decimals) {
    BigDecimal usd = BigDecimal.valueOf(amountCents).movePointLeft(2);
    return usd.divide(usdRate, 24, RoundingMode.HALF_UP)
      .movePointRight(decimals).setScale(0, RoundingMode.HALF_UP).longValueExact();
  }

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------

  private static String assetOf(GatewayChargeRequest request) {
    String asset = request.metadata().get("cryptoAsset");
    return asset == null ? "" : asset.toUpperCase(Locale.ROOT);
  }

  private static String requireAddress(String tenantOverride, String globalDefault, String label) {
    String address = (tenantOverride != null && !tenantOverride.isBlank()) ? tenantOverride : globalDefault;
    if (address == null || address.isBlank()) {
      throw new IllegalStateException("No merchant " + label + " receiving address configured");
    }
    return address;
  }

  /** Deterministic small offset so concurrent charges on the SAME address are distinguishable. */
  private static long taggingOffset(String orderRef, String asset) {
    String seed = (orderRef == null ? "" : orderRef) + ":" + asset;
    byte[] digest = sha256(seed);
    long v = 0;
    for (int i = 0; i < 8; i++) {
      v = (v << 8) | (digest[i] & 0xFF);
    }
    return Math.floorMod(v, TAG_MODULUS) + 1; // 1..TAG_MODULUS, never zero (always distinguishable from an untagged send)
  }

  private static int decimalsOf(String asset) {
    if (ASSET_USDT_TRC20.equals(asset)) return 6;
    if (ASSET_ETH_BEP20.equals(asset)) return 18;
    return 8; // BTC
  }

  private static String unitSuffixOf(String asset) {
    if (ASSET_USDT_TRC20.equals(asset)) return "USDT";
    if (ASSET_ETH_BEP20.equals(asset)) return "ETH";
    return "BTC";
  }

  private static String displayAmount(String asset, long smallestUnit) {
    return BigDecimal.valueOf(smallestUnit).movePointLeft(decimalsOf(asset)).toPlainString() + " " + unitSuffixOf(asset);
  }

  /** Same value as {@link #displayAmount}, without the unit suffix — for BIP21 URI construction. */
  private static String amountValue(String asset, long smallestUnit) {
    return BigDecimal.valueOf(smallestUnit).movePointLeft(decimalsOf(asset)).toPlainString();
  }

  private static String networkOf(String asset) {
    return switch (asset) {
      case ASSET_USDT_TRC20 -> "TRC20";
      case ASSET_ETH_BEP20 -> "BEP20";
      default -> "BTC";
    };
  }

  private String toJson(Map<String, Object> map) {
    try {
      return objectMapper.writeValueAsString(map);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to serialize crypto charge metadata", e);
    }
  }

  private JsonNode readTree(String body) {
    try {
      return objectMapper.readTree(body == null ? "{}" : body);
    } catch (Exception ex) {
      throw new IllegalStateException("Unparseable chain-API response", ex);
    }
  }

  private static String textOrEmpty(JsonNode node, String field) {
    JsonNode value = node.get(field);
    return (value == null || value.isNull()) ? "" : value.asText();
  }

  private static byte[] sha256(String value) {
    try {
      return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private static String sha256Hex(String value) {
    byte[] digest = sha256(value);
    StringBuilder sb = new StringBuilder(digest.length * 2);
    for (byte b : digest) {
      sb.append(Character.forDigit((b >> 4) & 0xF, 16));
      sb.append(Character.forDigit(b & 0xF, 16));
    }
    return sb.toString();
  }

  private static String sanitize(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
