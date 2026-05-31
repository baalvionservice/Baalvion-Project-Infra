package com.baalvion.fx.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Map;
import java.util.Set;

/**
 * Default deterministic FX feed. Mid rates are cross-computed from an anchor table of units per USD
 * and given a small, reproducible intraday drift (a function of the current minute and the pair),
 * so rates "move" without an external dependency — suitable for local/dev and CI. Forward points
 * use an indicative interest-rate table.
 *
 * This is an integration seam, not mock business data: real conversions/locks/forwards execute
 * against these rates exactly as they would against a live feed. Set
 * {@code app.fx.rate-provider=live} and provide a real {@link FxRateProvider} bean for production.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.fx.rate-provider", havingValue = "simulated", matchIfMissing = true)
public class SimulatedFxRateProvider implements FxRateProvider {

  // Indicative units of each currency per 1 USD.
  private static final Map<String, BigDecimal> PER_USD = Map.ofEntries(
    Map.entry("USD", new BigDecimal("1")),
    Map.entry("EUR", new BigDecimal("0.92")),
    Map.entry("GBP", new BigDecimal("0.79")),
    Map.entry("JPY", new BigDecimal("151.50")),
    Map.entry("CHF", new BigDecimal("0.88")),
    Map.entry("CAD", new BigDecimal("1.36")),
    Map.entry("AUD", new BigDecimal("1.52")),
    Map.entry("CNY", new BigDecimal("7.24")),
    Map.entry("HKD", new BigDecimal("7.82")),
    Map.entry("SGD", new BigDecimal("1.35")),
    Map.entry("INR", new BigDecimal("83.30")),
    Map.entry("AED", new BigDecimal("3.6725")),
    Map.entry("SAR", new BigDecimal("3.75")),
    Map.entry("ZAR", new BigDecimal("18.70")),
    Map.entry("NGN", new BigDecimal("1480.00")),
    Map.entry("KES", new BigDecimal("129.00")),
    Map.entry("BRL", new BigDecimal("5.05")),
    Map.entry("MXN", new BigDecimal("17.10")),
    Map.entry("NZD", new BigDecimal("1.64")),
    Map.entry("SEK", new BigDecimal("10.55")),
    Map.entry("NOK", new BigDecimal("10.80")));

  // Indicative annual interest rates (used only to derive forward points).
  private static final Map<String, BigDecimal> RATES = Map.ofEntries(
    Map.entry("USD", new BigDecimal("0.0525")),
    Map.entry("EUR", new BigDecimal("0.0400")),
    Map.entry("GBP", new BigDecimal("0.0525")),
    Map.entry("JPY", new BigDecimal("0.0010")),
    Map.entry("CHF", new BigDecimal("0.0150")),
    Map.entry("CAD", new BigDecimal("0.0500")),
    Map.entry("AUD", new BigDecimal("0.0435")),
    Map.entry("CNY", new BigDecimal("0.0345")),
    Map.entry("HKD", new BigDecimal("0.0525")),
    Map.entry("SGD", new BigDecimal("0.0375")),
    Map.entry("INR", new BigDecimal("0.0650")),
    Map.entry("AED", new BigDecimal("0.0525")),
    Map.entry("SAR", new BigDecimal("0.0550")),
    Map.entry("ZAR", new BigDecimal("0.0825")),
    Map.entry("NGN", new BigDecimal("0.2675")),
    Map.entry("KES", new BigDecimal("0.1300")),
    Map.entry("BRL", new BigDecimal("0.1050")),
    Map.entry("MXN", new BigDecimal("0.1100")),
    Map.entry("NZD", new BigDecimal("0.0550")),
    Map.entry("SEK", new BigDecimal("0.0400")),
    Map.entry("NOK", new BigDecimal("0.0450")));

  private static final Set<String> SUPPORTED = Set.of(
    "USD","EUR","GBP","JPY","CHF","CAD","AUD","CNY","HKD","SGD","INR","AED","SAR",
    "ZAR","NGN","KES","BRL","MXN","NZD","SEK","NOK");

  @Override
  public BigDecimal midRate(String base, String quote) {
    String b = norm(base), q = norm(quote);
    BigDecimal perUsdBase = PER_USD.get(b);
    BigDecimal perUsdQuote = PER_USD.get(q);
    if (perUsdBase == null || perUsdQuote == null || !SUPPORTED.contains(b) || !SUPPORTED.contains(q)) {
      throw new IllegalArgumentException("Unsupported currency pair " + b + "/" + q);
    }
    if (b.equals(q)) {
      return BigDecimal.ONE.setScale(8, RoundingMode.HALF_UP);
    }
    // base→quote = (quote per USD) / (base per USD)
    BigDecimal mid = perUsdQuote.divide(perUsdBase, 10, RoundingMode.HALF_UP);
    return mid.multiply(driftFactor(b, q)).setScale(8, RoundingMode.HALF_UP);
  }

  @Override
  public BigDecimal interestRate(String currency) {
    BigDecimal r = RATES.get(norm(currency));
    return r != null ? r : new BigDecimal("0.0500");
  }

  @Override
  public Set<String> supportedCurrencies() {
    return SUPPORTED;
  }

  @Override
  public String providerName() {
    return "simulated";
  }

  /** Reproducible ±0.1% intraday drift keyed by the current minute and the pair. */
  private BigDecimal driftFactor(String base, String quote) {
    long minute = Instant.now().getEpochSecond() / 60;
    int seed = (base + quote).hashCode();
    double drift = Math.sin((minute % 360) * Math.PI / 180.0 + (seed % 360)) * 0.001;
    return BigDecimal.valueOf(1.0 + drift);
  }

  private String norm(String c) {
    if (c == null) throw new IllegalArgumentException("currency required");
    return c.trim().toUpperCase();
  }
}
