package com.baalvion.aml.provider;

import java.math.BigDecimal;
import java.util.List;

/**
 * Port to the AML screening engine. Selected by {@code app.aml.provider}; the default
 * {@link RuleBasedAmlProvider} runs a built-in typology rules engine for local/dev, and a real
 * vendor adapter can be dropped in without touching the domain service.
 */
public interface AmlScreeningProvider {

  /** Transaction facts to screen. recentTxCount/recentTxTotal are optional velocity signals. */
  record ScreenInput(BigDecimal amount, String currency, String counterpartyCountry,
                     String direction, Integer recentTxCount, BigDecimal recentTxTotal) {}

  /** A monitoring rule that fired, with its contribution to the score. */
  record RuleHit(String code, String name, int points) {}

  /** Aggregate outcome: 0-100 score, FATF-aligned grade, and the rules that fired. */
  record ScreenOutcome(BigDecimal riskScore, String grade, List<RuleHit> rules) {}

  ScreenOutcome screen(ScreenInput input);

  String providerName();
}
