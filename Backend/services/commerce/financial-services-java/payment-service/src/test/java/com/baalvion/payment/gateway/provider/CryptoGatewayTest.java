package com.baalvion.payment.gateway.provider;

import com.baalvion.payment.gateway.config.PspProperties;
import com.baalvion.payment.gateway.spi.GatewayChargeRequest;
import com.baalvion.payment.gateway.spi.GatewayChargeResponse;
import com.baalvion.payment.gateway.spi.PaymentMethod;
import com.baalvion.payment.gateway.spi.ProviderConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Covers the AssetSpec-driven amount math and address resolution for every supported asset —
 * especially the newly added ones, since a silent arithmetic bug here means a customer is shown
 * (and the poller later validates against) a wrong charge amount, not a visible error. All
 * assertions run in {@code cfg.mock()} mode: no live chain/rate-API calls, deterministic output.
 */
class CryptoGatewayTest {

  private static final String ADDR = "0xTESTADDR0000000000000000000000000000";
  private CryptoGateway gateway;
  private ProviderConfig mockCfg;

  @BeforeEach
  void setUp() {
    PspProperties properties = new PspProperties();
    PspProperties.Crypto crypto = properties.getCrypto();
    crypto.setBtcAddress(ADDR);
    crypto.setUsdtTrc20Address(ADDR);
    crypto.setEthBep20Address(ADDR);
    crypto.setUsdtErc20Address(ADDR);
    crypto.setUsdcErc20Address(ADDR);
    crypto.setEthAddress(ADDR);
    crypto.setBnbAddress(ADDR);
    crypto.setUsdtBep20Address(ADDR);

    gateway = new CryptoGateway(properties, new ObjectMapper());
    mockCfg = new ProviderConfig("crypto", true, Map.of(), Map.of());
  }

  private GatewayChargeRequest chargeOf(String asset, long amountCents) {
    return new GatewayChargeRequest(
      "crypto", BigDecimal.valueOf(amountCents), "USD", PaymentMethod.CRYPTO,
      "order_" + asset, "idem_" + asset, Map.of(), Map.of("cryptoAsset", asset)
    );
  }

  // ---------------------------------------------------------------------------
  // Stablecoins — flat 1:1 USD, no rate lookup. USDT_BEP20 is the highest-risk case: it's the
  // only stablecoin here with 18 decimals (USDT_TRC20/USDT_ERC20/USDC_ERC20 all use 6) — a wrong
  // hardcoded "10_000 per cent" constant (the ORIGINAL code, before this generalization) would
  // silently undercharge/overcharge by 12 orders of magnitude for this asset.
  // ---------------------------------------------------------------------------

  @Test
  void initiate_usdtBep20_18DecimalStablecoin_computesCorrectAmount() {
    GatewayChargeResponse res = gateway.initiate(chargeOf("USDT_BEP20", 250_00), mockCfg);
    // $250.00 of an 18-decimal, 1:1-USD stablecoin == 250 * 10^16 smallest units, plus a tag
    // in [1, 1000]. amountValue is the tagged amount rendered back through movePointLeft(18).
    assertThat(res.clientParams().get("network")).isEqualTo("BEP20");
    assertThat(res.clientParams().get("amountDisplay")).endsWith(" USDT");
    BigDecimal shown = new BigDecimal(res.clientParams().get("amountValue"));
    BigDecimal expectedFloor = new BigDecimal("250"); // tag is negligible (<= 1000 / 10^18)
    assertThat(shown.subtract(expectedFloor).abs()).isLessThan(new BigDecimal("0.000000000000001"));
  }

  @Test
  void initiate_usdtErc20_6DecimalStablecoin_computesCorrectAmount() {
    GatewayChargeResponse res = gateway.initiate(chargeOf("USDT_ERC20", 100_00), mockCfg);
    assertThat(res.clientParams().get("network")).isEqualTo("ERC20");
    BigDecimal shown = new BigDecimal(res.clientParams().get("amountValue"));
    assertThat(shown.subtract(new BigDecimal("100")).abs()).isLessThan(new BigDecimal("0.001"));
  }

  @Test
  void initiate_usdcErc20_computesCorrectAmount() {
    GatewayChargeResponse res = gateway.initiate(chargeOf("USDC_ERC20", 1000_00), mockCfg);
    assertThat(res.clientParams().get("amountDisplay")).endsWith(" USDC");
    BigDecimal shown = new BigDecimal(res.clientParams().get("amountValue"));
    assertThat(shown.subtract(new BigDecimal("1000")).abs()).isLessThan(new BigDecimal("0.001"));
  }

  // ---------------------------------------------------------------------------
  // Volatile assets — go through the mock USD rate (usdRate(..., mock=true)), which must be
  // deterministic and non-zero for every asset, or initiate() throws / divides by a bad rate.
  // ---------------------------------------------------------------------------

  @Test
  void initiate_nativeEth_usesMockRate_andRecordsIt() {
    GatewayChargeResponse res = gateway.initiate(chargeOf("ETH", 300_00), mockCfg);
    assertThat(res.clientParams().get("network")).isEqualTo("ETH");
    assertThat(res.clientParams().get("amountDisplay")).endsWith(" ETH");
    // mock ETH/USD rate is 3000 -> $300 == 0.1 ETH
    BigDecimal shown = new BigDecimal(res.clientParams().get("amountValue"));
    assertThat(shown.subtract(new BigDecimal("0.1")).abs()).isLessThan(new BigDecimal("0.0001"));
  }

  @Test
  void initiate_nativeBnb_usesMockRate_distinctFromEth() {
    GatewayChargeResponse res = gateway.initiate(chargeOf("BNB", 300_00), mockCfg);
    assertThat(res.clientParams().get("network")).isEqualTo("BNB");
    // mock BNB/USD rate is 600 -> $300 == 0.5 BNB
    BigDecimal shown = new BigDecimal(res.clientParams().get("amountValue"));
    assertThat(shown.subtract(new BigDecimal("0.5")).abs()).isLessThan(new BigDecimal("0.0001"));
  }

  // ---------------------------------------------------------------------------
  // Asset/network confusion guards — ETH_BEP20 (Binance-Peg token on BSC), native ETH, and
  // USDT_BEP20 (a third distinct USDT contract) must never collapse into each other.
  // ---------------------------------------------------------------------------

  @Test
  void ethBep20_and_nativeEth_and_usdtBep20_areAllDistinctNetworksAndUnits() {
    GatewayChargeResponse bep20Eth = gateway.initiate(chargeOf("ETH_BEP20", 100_00), mockCfg);
    GatewayChargeResponse nativeEth = gateway.initiate(chargeOf("ETH", 100_00), mockCfg);
    GatewayChargeResponse usdtBep20 = gateway.initiate(chargeOf("USDT_BEP20", 100_00), mockCfg);

    assertThat(bep20Eth.clientParams().get("network")).isEqualTo("BEP20");
    assertThat(nativeEth.clientParams().get("network")).isEqualTo("ETH");
    assertThat(usdtBep20.clientParams().get("network")).isEqualTo("BEP20");

    // Same "BEP20" network label for two DIFFERENT assets is expected (both live on BSC) — what
    // must never happen is them sharing a unit suffix or amount semantics.
    assertThat(bep20Eth.clientParams().get("amountDisplay")).endsWith(" ETH");
    assertThat(usdtBep20.clientParams().get("amountDisplay")).endsWith(" USDT");
  }

  // ---------------------------------------------------------------------------
  // Address resolution failures
  // ---------------------------------------------------------------------------

  @Test
  void initiate_unconfiguredAddress_throwsIllegalStateException() {
    PspProperties bare = new PspProperties(); // no addresses set anywhere
    CryptoGateway bareGateway = new CryptoGateway(bare, new ObjectMapper());
    assertThatThrownBy(() -> bareGateway.initiate(chargeOf("BNB", 100_00), mockCfg))
      .isInstanceOf(IllegalStateException.class)
      .hasMessageContaining("BNB");
  }

  @Test
  void initiate_unsupportedAsset_throwsIllegalArgumentException() {
    assertThatThrownBy(() -> gateway.initiate(chargeOf("DOGE", 100_00), mockCfg))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("DOGE");
  }

  @Test
  void initiate_tenantOverrideAddress_winsOverGlobalDefault() {
    ProviderConfig cfgWithTenantAddr = new ProviderConfig(
      "crypto", true, Map.of(), Map.of("bnbAddress", "tenant-specific-address")
    );
    GatewayChargeResponse res = gateway.initiate(chargeOf("BNB", 100_00), cfgWithTenantAddr);
    assertThat(res.clientParams().get("address")).isEqualTo("tenant-specific-address");
  }

  // ---------------------------------------------------------------------------
  // confirmedAmountToCents — must invert initiate()'s amount math (minus the tagging offset),
  // for both a stable asset (18-decimal case) and a volatile one, at every decimals value used.
  // ---------------------------------------------------------------------------

  @Test
  void confirmedAmountToCents_roundTrips_forUsdtBep20_18Decimals() {
    long amountCents = 250_00;
    GatewayChargeResponse res = gateway.initiate(chargeOf("USDT_BEP20", amountCents), mockCfg);
    java.math.BigInteger target = new java.math.BigInteger(extractRawField(res.rawResponse(), "targetSmallestUnit"));
    java.math.BigInteger tag = java.math.BigInteger.valueOf(Long.parseLong(extractRawField(res.rawResponse(), "taggingOffsetSmallestUnit")));

    long backToCents = gateway.confirmedAmountToCents("USDT_BEP20", target, tag, null);
    assertThat(backToCents).isEqualTo(amountCents);
  }

  @Test
  void confirmedAmountToCents_roundTrips_forNativeEth_volatileRate() {
    long amountCents = 300_00;
    GatewayChargeResponse res = gateway.initiate(chargeOf("ETH", amountCents), mockCfg);
    java.math.BigInteger target = new java.math.BigInteger(extractRawField(res.rawResponse(), "targetSmallestUnit"));
    java.math.BigInteger tag = java.math.BigInteger.valueOf(Long.parseLong(extractRawField(res.rawResponse(), "taggingOffsetSmallestUnit")));
    BigDecimal rateUsed = new BigDecimal(extractRawField(res.rawResponse(), "usdRateUsed"));

    long backToCents = gateway.confirmedAmountToCents("ETH", target, tag, rateUsed);
    assertThat(backToCents).isEqualTo(amountCents);
  }

  private static String extractRawField(String rawJson, String field) {
    try {
      return new ObjectMapper().readTree(rawJson).get(field).asText();
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  // ---------------------------------------------------------------------------
  // Mock chain-confirmation path — asset-agnostic, but pin it for a newly added asset too so a
  // future change to the mock branch can't silently start excluding new assets.
  // ---------------------------------------------------------------------------

  @Test
  void checkForPayment_mockMode_confirmsNewAssetAfterDelay() {
    Instant longAgo = Instant.now().minusSeconds(10);
    Optional<CryptoGateway.ChainMatch> match =
      gateway.checkForPayment("USDT_BEP20", ADDR, java.math.BigInteger.valueOf(12345L), longAgo, mockCfg);
    assertThat(match).isPresent();
    assertThat(match.get().confirmations()).isEqualTo(99);
    assertThat(match.get().confirmedSmallestUnit()).isEqualTo(java.math.BigInteger.valueOf(12345L));
  }

  @Test
  void checkForPayment_mockMode_notYetConfirmedTooSoon() {
    Optional<CryptoGateway.ChainMatch> match =
      gateway.checkForPayment("BNB", ADDR, java.math.BigInteger.valueOf(12345L), Instant.now(), mockCfg);
    assertThat(match).isEmpty();
  }
}
