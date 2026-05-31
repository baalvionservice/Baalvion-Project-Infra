package com.baalvion.trustscore.provider;

import java.math.BigDecimal;
import java.util.List;

/**
 * Port to the trust-scoring engine. Selected by {@code app.trust-score.provider}; the default
 * {@link WeightedTrustScoreProvider} runs a transparent weighted-factor model, and a real ML/vendor
 * adapter can be dropped in without touching the domain service.
 */
public interface TrustScoreProvider {

  /**
   * Scoring signals for a subject. All fields are optional — a null is treated as a neutral or
   * benign default so missing data does not unfairly penalize a new counterparty.
   *
   * @param kycLevel          KYC tier 0..3 (0 = unverified)
   * @param onTimePaymentRate fraction of obligations paid on time, 0..1
   * @param disputeRate       fraction of transactions disputed, 0..1
   * @param activityScore     normalized trading-activity strength, 0..1
   * @param tenureMonths      account age in months
   * @param sanctionsHits     count of sanctions/watchlist hits (any &gt; 0 zeroes the compliance factor)
   */
  record ScoreInput(Integer kycLevel, BigDecimal onTimePaymentRate, BigDecimal disputeRate,
                    BigDecimal activityScore, Integer tenureMonths, Integer sanctionsHits) {}

  /** One factor's contribution: its 0..1 normalized value and resulting 0..1000 points. */
  record FactorContribution(String name, BigDecimal weight, BigDecimal value, int points) {}

  /** Aggregate outcome: 0..1000 score, band, and the per-factor breakdown. */
  record ScoreOutcome(int score, String band, List<FactorContribution> factors) {}

  ScoreOutcome score(ScoreInput input);

  String providerName();
}
