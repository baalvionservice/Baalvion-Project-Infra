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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Crypto PSP adapter — NON-CUSTODIAL. Unlike Razorpay/Stripe/PayU, there is no live merchant
 * account to call: {@code initiate} hands out the merchant's OWN fixed, pre-configured
 * receiving address (never generated/derived here — see {@link PspProperties.Crypto}'s javadoc)
 * plus a tagged target amount, and NOTHING is automatically confirmed by a provider webhook,
 * because a self-custodied wallet has no webhook to send one. Confirmation instead comes from
 * {@link com.baalvion.payment.gateway.service.CryptoChainPoller}, which polls a public block
 * explorer / RPC and — on a match — calls this class's {@link #checkForPayment} then feeds the
 * result into the exact same {@code GatewayService.applyWebhook} pipeline every other provider
 * uses.
 *
 * <p><b>Supported assets</b> (8): {@code USDT_TRC20} (Tron), {@code BTC}, {@code ETH_BEP20}
 * (Binance-Peg Ethereum Token on BSC — NOT native ETH), {@code USDT_ERC20}/{@code USDC_ERC20}
 * (Ethereum mainnet tokens), {@code ETH} (native Ethereum mainnet coin), {@code BNB} (native
 * BNB Smart Chain coin), {@code USDT_BEP20} (a THIRD, distinct USDT contract, on BSC — not the
 * same token as USDT_TRC20 or USDT_ERC20). Each asset's behavior is described once by an
 * {@link AssetSpec} entry
 * in {@link #ASSET_SPECS} instead of per-asset copy-pasted branches — adding an 8th asset means
 * adding one {@code ASSET_SPECS} entry and, if it needs a genuinely new detection technique,
 * one new {@link ChainVerifier} implementation (most new EVM tokens need neither — they reuse
 * {@link EvmErc20Verifier} with a different RPC URL / contract address).
 *
 * <p><b>Stablecoins</b> (USDT/USDC, any network) are flat 1:1 USD, no rate lookup. BTC, native
 * ETH, ETH-BEP20, and native BNB all track a volatile market price, so those go through a live
 * USD-rate lookup at charge-creation time (see {@link #usdRate}), with the rate used stored in
 * {@code rawResponse} so the SAME rate is used to convert the confirmed on-chain amount back to
 * cents later (never re-fetched, which would drift from the amount the payer was actually shown).
 *
 * <p><b>Amount-tagging:</b> since many charges can share the SAME address (there is only one
 * merchant wallet per asset, not one address per order), each charge's on-chain target amount
 * gets a tiny deterministic offset (a handful of the smallest unit — negligible value) derived
 * from the order ref, so concurrent charges are individually distinguishable on-chain. The tag
 * is stored in {@code rawResponse} and subtracted back out when converting a confirmed on-chain
 * amount back to the USD-cents unit {@code GatewayService} validates against.
 *
 * <p><b>Native-coin detection is deliberately NOT {@code eth_getLogs}</b>: native ETH/BNB
 * transfers emit no event log (that's an ERC20/BEP20-only mechanism), so {@link EvmNativeVerifier}
 * uses an Etherscan/BscScan-compatible "account transaction list" API instead of scanning raw
 * blocks — scanning every block in the charge-expiry window via {@code eth_getBlockByNumber}
 * would mean hundreds of individual RPC calls per poll tick per pending charge, which no public
 * or free-tier RPC endpoint tolerates. This mirrors how BTC already uses mempool.space (an
 * address-history explorer API) rather than scanning raw blocks itself.
 *
 * <p>⚠ VERIFY AT EXECUTION TIME: {@link #tronGridTransfers}, {@link EvmErc20Verifier#check},
 * {@link EvmNativeVerifier#check}, and {@link #mempoolAddressTxs}/{@link #mempoolTipHeight} parse
 * TronGrid's, BSC/Ethereum's EVM JSON-RPC, Etherscan/BscScan's, and mempool.space's PUBLICLY
 * DOCUMENTED response shapes as of their current API versions — not confirmed against a live
 * call from this development environment (no outbound network access here). The USDT-ERC20 and
 * USDC-ERC20 mainnet contract addresses in {@link PspProperties.Crypto}'s defaults are likewise
 * unverified against a live source in this environment — confirm both the API response shapes
 * and the contract addresses against Etherscan before relying on any of this in production; this
 * is the ONE place that risk lives.
 */
@Slf4j
@Component
public class CryptoGateway implements PaymentGateway {

  static final String PROVIDER = "crypto";

  static final String ASSET_USDT_TRC20 = "USDT_TRC20";
  /** Binance-Peg Ethereum Token — a BEP20 (BSC) token tracking ETH/USD, NOT a stablecoin like
   *  USDT: it needs a live rate lookup at charge time, same as BTC (see {@link #usdRate}). */
  static final String ASSET_ETH_BEP20 = "ETH_BEP20";
  static final String ASSET_BTC = "BTC";
  static final String ASSET_USDT_ERC20 = "USDT_ERC20";
  static final String ASSET_USDC_ERC20 = "USDC_ERC20";
  /** Native Ethereum mainnet ETH — distinct from {@link #ASSET_ETH_BEP20} (a BSC token). */
  static final String ASSET_ETH = "ETH";
  /** Native BNB Smart Chain coin — distinct from any BEP20 *token* (there is none here for BNB
   *  itself; BNB is the chain's own gas/native asset, same relationship as ETH is to Ethereum). */
  static final String ASSET_BNB = "BNB";
  /** USDT on BSC (BEP20) — a DIFFERENT token/contract from both {@link #ASSET_USDT_TRC20} and
   *  {@link #ASSET_USDT_ERC20}; this is what exchanges label "USDT via BEP20/BSC network". Same
   *  chain as {@link #ASSET_ETH_BEP20} but its own contract — 18 decimals (unlike the TRC20/ERC20
   *  USDT contracts, which use 6). */
  static final String ASSET_USDT_BEP20 = "USDT_BEP20";

  /** keccak256("Transfer(address,address,uint256)") — the ERC20/BEP20 Transfer event's topic0
   *  (EVM chains share the same event ABI) — a fixed constant, never derived. */
  private static final String TRANSFER_EVENT_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  /** Tagging offset range in the target asset's smallest unit — a few units, negligible value. */
  private static final long TAG_MODULUS = 1000L;

  /**
   * Describes one supported asset's charge-creation and amount-conversion behavior. Detection
   * (the actual chain read) is a separate concern, wired up in {@link #buildVerifiers}.
   *
   * @param addressConfigKey the {@code ProviderConfig.config}/CMS-vault key holding the
   *                          merchant's receiving address for this asset (e.g. {@code "btcAddress"})
   * @param decimals          smallest-unit decimal places (BTC=8, most EVM tokens=6 or 18)
   * @param unitSuffix        display suffix (e.g. {@code "BTC"}, {@code "USDT"})
   * @param network           display network label (e.g. {@code "TRC20"}, {@code "ERC20"})
   * @param stable            true for USD-pegged stablecoins (flat 1:1, no rate lookup)
   * @param rateCoinGeckoId   CoinGecko id for the live USD rate lookup; null when {@code stable}
   */
  private record AssetSpec(
    String addressConfigKey,
    int decimals,
    String unitSuffix,
    String network,
    boolean stable,
    String rateCoinGeckoId
  ) {}

  private static final Map<String, AssetSpec> ASSET_SPECS = Map.ofEntries(
    Map.entry(ASSET_USDT_TRC20, new AssetSpec("usdtTrc20Address", 6, "USDT", "TRC20", true, null)),
    Map.entry(ASSET_BTC, new AssetSpec("btcAddress", 8, "BTC", "BTC", false, "bitcoin")),
    Map.entry(ASSET_ETH_BEP20, new AssetSpec("ethBep20Address", 18, "ETH", "BEP20", false, "ethereum")),
    Map.entry(ASSET_USDT_ERC20, new AssetSpec("usdtErc20Address", 6, "USDT", "ERC20", true, null)),
    Map.entry(ASSET_USDC_ERC20, new AssetSpec("usdcErc20Address", 6, "USDC", "ERC20", true, null)),
    Map.entry(ASSET_ETH, new AssetSpec("ethAddress", 18, "ETH", "ETH", false, "ethereum")),
    Map.entry(ASSET_BNB, new AssetSpec("bnbAddress", 18, "BNB", "BNB", false, "binancecoin")),
    Map.entry(ASSET_USDT_BEP20, new AssetSpec("usdtBep20Address", 18, "USDT", "BEP20", true, null))
  );

  private final PspProperties.Crypto config;
  private final ObjectMapper objectMapper;
  private final RestClient restClient;

  /** One {@link ChainVerifier} per supported asset, built once from {@link #config}. */
  private final Map<String, ChainVerifier> verifiers;

  public CryptoGateway(PspProperties properties, ObjectMapper objectMapper) {
    this.config = properties.getCrypto();
    this.objectMapper = objectMapper;
    this.restClient = RestClient.builder().build();
    this.verifiers = buildVerifiers();
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
    AssetSpec spec = ASSET_SPECS.get(asset);
    if (spec == null) {
      throw new IllegalArgumentException(
        "Unsupported cryptoAsset (expected one of " + ASSET_SPECS.keySet() + "): " + asset);
    }

    long amountCents = request.amount().longValueExact();
    long tagSmallestUnit = taggingOffset(request.orderRef(), asset);

    String address = requireAddress(cfg.configString(spec.addressConfigKey()), globalDefaultAddress(asset), asset);

    BigDecimal usdRateUsed = null;
    long targetSmallestUnit;
    if (spec.stable()) {
      targetSmallestUnit = stableUnitsForCents(amountCents, spec.decimals()) + tagSmallestUnit;
    } else {
      usdRateUsed = usdRate(spec.rateCoinGeckoId(), cfg.mock());
      targetSmallestUnit = usdToSmallestUnit(amountCents, usdRateUsed, spec.decimals()) + tagSmallestUnit;
    }

    String providerRef = "crypto_" + UUID.randomUUID();
    Instant expiresAt = Instant.now().plusSeconds(config.getChargeExpiryMinutes() * 60);

    Map<String, Object> raw = new LinkedHashMap<>();
    raw.put("asset", asset);
    raw.put("network", spec.network());
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
    clientParams.put("network", spec.network());
    clientParams.put("address", address);
    // Raw numeric amount (no unit suffix) — lets the client build a BIP21 URI ("bitcoin:<addr>?
    // amount=<amountValue>") for QR codes that pre-fill the amount in the paying wallet, not just
    // amountDisplay's human-readable "0.00081235 BTC" string.
    clientParams.put("amountValue", amountValue(spec, targetSmallestUnit));
    clientParams.put("amountDisplay", displayAmount(spec, targetSmallestUnit));
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

  /** Strategy interface for "has this address received >= target since some time?" — one
   *  implementation per detection technique, not one per asset (several assets share an
   *  implementation, parameterized differently; see {@link #buildVerifiers}). */
  private interface ChainVerifier {
    Optional<ChainMatch> check(String address, long targetSmallestUnit, Instant since);
  }

  private Map<String, ChainVerifier> buildVerifiers() {
    Map<String, ChainVerifier> m = new LinkedHashMap<>();
    m.put(ASSET_USDT_TRC20, new TronTrc20Verifier(config.getUsdtTrc20ContractAddress()));
    m.put(ASSET_ETH_BEP20, new EvmErc20Verifier(config.getBscRpcUrl(), config.getEthBep20ContractAddress(), config.getBscConfirmationsRequired()));
    m.put(ASSET_USDT_ERC20, new EvmErc20Verifier(config.getEthRpcUrl(), config.getUsdtErc20ContractAddress(), config.getEthConfirmationsRequired()));
    m.put(ASSET_USDC_ERC20, new EvmErc20Verifier(config.getEthRpcUrl(), config.getUsdcErc20ContractAddress(), config.getEthConfirmationsRequired()));
    m.put(ASSET_ETH, new EvmNativeVerifier(config.getEthRpcUrl(), config.getEtherscanApiBaseUrl(), config.getEtherscanApiKey(), config.getEthConfirmationsRequired()));
    m.put(ASSET_BNB, new EvmNativeVerifier(config.getBscRpcUrl(), config.getBscscanApiBaseUrl(), config.getBscscanApiKey(), config.getBscConfirmationsRequired()));
    m.put(ASSET_USDT_BEP20, new EvmErc20Verifier(config.getBscRpcUrl(), config.getUsdtBep20ContractAddress(), config.getBscConfirmationsRequired()));
    m.put(ASSET_BTC, new BitcoinVerifier());
    return Map.copyOf(m);
  }

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
    ChainVerifier verifier = verifiers.get(asset);
    if (verifier == null) {
      log.warn("Crypto poller: no chain verifier registered for asset={}", asset);
      return Optional.empty();
    }
    return verifier.check(address, targetSmallestUnit, since);
  }

  /** Converts a confirmed on-chain amount + this charge's stored tagging offset back to USD cents. */
  public long confirmedAmountToCents(String asset, long confirmedSmallestUnit, long taggingOffsetSmallestUnit, BigDecimal usdRateUsed) {
    AssetSpec spec = ASSET_SPECS.get(asset);
    Objects.requireNonNull(spec, () -> "Unknown asset: " + asset);
    long untagged = confirmedSmallestUnit - taggingOffsetSmallestUnit;
    if (spec.stable()) {
      return untagged / stableSmallestUnitsPerCent(spec.decimals());
    }
    Objects.requireNonNull(usdRateUsed, "usdRateUsed is required to convert a non-stable asset amount back to cents");
    BigDecimal whole = BigDecimal.valueOf(untagged).movePointLeft(spec.decimals());
    return whole.multiply(usdRateUsed).movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
  }

  // ---------------------------------------------------------------------------
  // TronGrid (USDT-TRC20) — unchanged behavior, contract address now parameterized
  // ---------------------------------------------------------------------------

  private final class TronTrc20Verifier implements ChainVerifier {
    private final String contractAddress;

    TronTrc20Verifier(String contractAddress) {
      this.contractAddress = contractAddress;
    }

    @Override
    public Optional<ChainMatch> check(String address, long targetSmallestUnit, Instant since) {
      return tronGridTransfers(address, targetSmallestUnit, contractAddress);
    }
  }

  private Optional<ChainMatch> tronGridTransfers(String address, long targetSmallestUnit, String contractAddress) {
    String url = config.getTronGridBaseUrl() + "/v1/accounts/" + address
      + "/transactions/trc20?limit=50&contract_address=" + contractAddress;
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
  // EVM ERC20/BEP20 token Transfer-event scan (ETH-BEP20, USDT-ERC20, USDC-ERC20) —
  // generalizes the original BEP20-only logic to any (rpcUrl, contractAddress) pair.
  // ---------------------------------------------------------------------------

  private final class EvmErc20Verifier implements ChainVerifier {
    private final String rpcUrl;
    private final String contractAddress;
    private final int confirmationsRequired;

    EvmErc20Verifier(String rpcUrl, String contractAddress, int confirmationsRequired) {
      this.rpcUrl = rpcUrl;
      this.contractAddress = contractAddress;
      this.confirmationsRequired = confirmationsRequired;
    }

    /**
     * ⚠ VERIFY AT EXECUTION TIME (see class javadoc): decodes raw JSON-RPC {@code eth_getLogs}
     * results by hand (no web3/ethers dependency) — topic0 is the fixed Transfer event
     * signature, topic2 is the recipient address (32-byte, zero-left-padded), and {@code data}
     * is the raw uint256 transfer amount as hex. Queries only the last ~1500 blocks to keep the
     * request cheap enough for a public, unauthenticated RPC endpoint.
     */
    @Override
    public Optional<ChainMatch> check(String address, long targetSmallestUnit, Instant since) {
      Long latestBlock = evmBlockNumber(rpcUrl);
      if (latestBlock == null) {
        return Optional.empty();
      }
      long fromBlock = Math.max(0, latestBlock - 1500);
      String paddedAddress = "0x" + "0".repeat(24) + address.toLowerCase(Locale.ROOT).replaceFirst("^0x", "");

      Map<String, Object> filter = new LinkedHashMap<>();
      filter.put("fromBlock", "0x" + Long.toHexString(fromBlock));
      filter.put("toBlock", "latest");
      filter.put("address", contractAddress);
      // Arrays.asList (NOT List.of) — List.of throws NullPointerException on a null element, and
      // the middle topic slot (topic1 = sender, unfiltered) must be null per eth_getLogs' convention.
      filter.put("topics", java.util.Arrays.asList(TRANSFER_EVENT_TOPIC, null, paddedAddress));

      JsonNode result = evmRpcCall(rpcUrl, "eth_getLogs", List.of(filter));
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
        if (confirmations < confirmationsRequired) {
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
  }

  // ---------------------------------------------------------------------------
  // Native EVM coin transfers (ETH, BNB) — an Etherscan/BscScan-compatible "account tx list"
  // API, NOT eth_getLogs (native transfers emit no event log) and NOT raw block scanning (would
  // be hundreds of eth_getBlockByNumber calls per poll tick — see class javadoc).
  // ---------------------------------------------------------------------------

  private final class EvmNativeVerifier implements ChainVerifier {
    private final String rpcUrl;
    private final String explorerApiBaseUrl;
    private final String explorerApiKey;
    private final int confirmationsRequired;

    EvmNativeVerifier(String rpcUrl, String explorerApiBaseUrl, String explorerApiKey, int confirmationsRequired) {
      this.rpcUrl = rpcUrl;
      this.explorerApiBaseUrl = explorerApiBaseUrl;
      this.explorerApiKey = explorerApiKey;
      this.confirmationsRequired = confirmationsRequired;
    }

    /**
     * ⚠ VERIFY AT EXECUTION TIME (see class javadoc): Etherscan/BscScan's {@code module=account
     * &action=txlist} response shape — a JSON array of tx objects with {@code to}, {@code value}
     * (decimal-string wei), {@code hash}, {@code blockNumber}, {@code isError}.
     */
    @Override
    public Optional<ChainMatch> check(String address, long targetSmallestUnit, Instant since) {
      if (explorerApiKey == null || explorerApiKey.isBlank()) {
        log.warn("Native EVM verifier for {} has no explorer API key configured — skipping", sanitize(address));
        return Optional.empty();
      }
      Long latestBlock = evmBlockNumber(rpcUrl);
      if (latestBlock == null) {
        return Optional.empty();
      }
      String url = explorerApiBaseUrl + "?module=account&action=txlist&address=" + address
        + "&sort=desc&apikey=" + explorerApiKey;
      String body;
      try {
        body = restClient.get().uri(url).retrieve().body(String.class);
      } catch (RuntimeException ex) {
        log.warn("Explorer txlist lookup failed for address={}: {}", sanitize(address), ex.getMessage());
        return Optional.empty();
      }
      JsonNode root = readTree(body);
      for (JsonNode tx : root.path("result")) {
        if (!"0".equals(textOrEmpty(tx, "isError"))) {
          continue; // failed transaction, no value actually moved
        }
        if (!address.equalsIgnoreCase(textOrEmpty(tx, "to"))) {
          continue;
        }
        long value = parseLongSafe(textOrEmpty(tx, "value"));
        if (value < targetSmallestUnit) {
          continue;
        }
        long txBlock = parseLongSafe(textOrEmpty(tx, "blockNumber"));
        int confirmations = (int) Math.max(0, latestBlock - txBlock + 1);
        if (confirmations < confirmationsRequired) {
          continue;
        }
        String txHash = textOrEmpty(tx, "hash");
        if (txHash.isEmpty()) {
          continue;
        }
        return Optional.of(new ChainMatch(txHash, value, confirmations));
      }
      return Optional.empty();
    }
  }

  private static long parseLongSafe(String value) {
    if (value == null || value.isBlank()) {
      return 0L;
    }
    try {
      return Long.parseLong(value.trim());
    } catch (NumberFormatException ex) {
      return 0L;
    }
  }

  // ---------------------------------------------------------------------------
  // Shared EVM JSON-RPC helper (used by EvmErc20Verifier and EvmNativeVerifier's block-number
  // lookup) — works against any EVM-compatible chain given that chain's RPC URL.
  // ---------------------------------------------------------------------------

  private Long evmBlockNumber(String rpcUrl) {
    JsonNode result = evmRpcCall(rpcUrl, "eth_blockNumber", List.of());
    if (result == null || !result.isTextual()) {
      return null;
    }
    return hexToLong(result.asText());
  }

  /** Minimal JSON-RPC 2.0 client — no web3/ethers dependency, see method javadoc above. */
  private JsonNode evmRpcCall(String rpcUrl, String method, List<Object> params) {
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
    // ($100-$1,000 tiers): even 18-decimal wei amounts stay well under long's ~9.22e18 max for
    // any plausible ETH/BNB/USD rate. Would need BigInteger instead if amounts/decimals ever grow
    // enough to risk overflow. Long.parseUnsignedLong tolerates the full unsigned 64-bit range
    // (this also parses block numbers, which are far smaller).
    return Long.parseUnsignedLong(h, 16);
  }

  // ---------------------------------------------------------------------------
  // mempool.space (BTC) — unchanged
  // ---------------------------------------------------------------------------

  private final class BitcoinVerifier implements ChainVerifier {
    @Override
    public Optional<ChainMatch> check(String address, long targetSmallestUnit, Instant since) {
      return mempoolAddressTxs(address, targetSmallestUnit);
    }
  }

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

  // ---------------------------------------------------------------------------
  // USD rate lookup (BTC, ETH, ETH-BEP20, BNB — anything non-stable)
  // ---------------------------------------------------------------------------

  private BigDecimal usdRate(String coinGeckoId, boolean mock) {
    if (mock) {
      return switch (coinGeckoId) {
        case "bitcoin" -> BigDecimal.valueOf(60000);
        case "ethereum" -> BigDecimal.valueOf(3000);
        case "binancecoin" -> BigDecimal.valueOf(600);
        default -> BigDecimal.valueOf(1);
      };
    }
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

  /** 1 whole stablecoin unit == 10^decimals smallest units; 1 USD cent == 1/100 of that whole
   *  unit (stablecoins are 1:1 USD-pegged) == 10^(decimals-2) smallest units per cent. */
  private static long stableSmallestUnitsPerCent(int decimals) {
    return (long) Math.pow(10, decimals - 2);
  }

  private static long stableUnitsForCents(long amountCents, int decimals) {
    return amountCents * stableSmallestUnitsPerCent(decimals);
  }

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------

  private static String assetOf(GatewayChargeRequest request) {
    String asset = request.metadata().get("cryptoAsset");
    return asset == null ? "" : asset.toUpperCase(Locale.ROOT);
  }

  /** The global-env-configured merchant address for {@code asset}, or null if unset — the
   *  tenant CMS-vault override (checked first, by the caller) always wins when present. */
  private String globalDefaultAddress(String asset) {
    return switch (asset) {
      case ASSET_USDT_TRC20 -> config.getUsdtTrc20Address();
      case ASSET_ETH_BEP20 -> config.getEthBep20Address();
      case ASSET_BTC -> config.getBtcAddress();
      case ASSET_USDT_ERC20 -> config.getUsdtErc20Address();
      case ASSET_USDC_ERC20 -> config.getUsdcErc20Address();
      case ASSET_ETH -> config.getEthAddress();
      case ASSET_BNB -> config.getBnbAddress();
      case ASSET_USDT_BEP20 -> config.getUsdtBep20Address();
      default -> null;
    };
  }

  private static String requireAddress(String tenantOverride, String globalDefault, String asset) {
    String address = (tenantOverride != null && !tenantOverride.isBlank()) ? tenantOverride : globalDefault;
    if (address == null || address.isBlank()) {
      throw new IllegalStateException("No merchant " + asset + " receiving address configured");
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

  private static String displayAmount(AssetSpec spec, long smallestUnit) {
    return BigDecimal.valueOf(smallestUnit).movePointLeft(spec.decimals()).toPlainString() + " " + spec.unitSuffix();
  }

  /** Same value as {@link #displayAmount}, without the unit suffix — for BIP21-style URI construction. */
  private static String amountValue(AssetSpec spec, long smallestUnit) {
    return BigDecimal.valueOf(smallestUnit).movePointLeft(spec.decimals()).toPlainString();
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
