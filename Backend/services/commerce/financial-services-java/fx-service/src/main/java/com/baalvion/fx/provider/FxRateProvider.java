package com.baalvion.fx.provider;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Port to the source of market FX data. Implementations are selected by
 * {@code app.fx.rate-provider}; the default {@link SimulatedFxRateProvider} is a deterministic
 * in-process feed for local/dev and CI, and a real market-data adapter can be dropped in for
 * production without changing the pricing/booking services.
 */
public interface FxRateProvider {

  /** Mid rate: 1 unit of {@code base} expressed in {@code quote} (cross-computed via the anchor). */
  BigDecimal midRate(String base, String quote);

  /** Indicative annual interest rate for a currency, used to derive forward points. */
  BigDecimal interestRate(String currency);

  /** Currencies this provider can price. */
  Set<String> supportedCurrencies();

  /** Identifier of the active provider, surfaced in rate snapshots for traceability. */
  String providerName();
}
