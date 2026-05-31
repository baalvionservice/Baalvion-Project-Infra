package com.baalvion.trustscore.provider;

import com.baalvion.trustscore.config.TrustScoreProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Built-in weighted-factor trust scoring model (default provider). Each factor is normalized to a
 * 0..1 value, multiplied by its configured weight, and the weighted sum is scaled onto 0..1000.
 * Transparent and explainable (every factor's contribution is returned); swap in a vendor/ML adapter
 * via {@code app.trust-score.provider=vendor}.
 *
 * Factors: KYC verification, payment reliability, dispute rate (inverted), trading activity, account
 * tenure, and sanctions/compliance (a single hit zeroes that factor).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.trust-score.provider", havingValue = "simulated", matchIfMissing = true)
public class WeightedTrustScoreProvider implements TrustScoreProvider {

  private final TrustScoreProperties props;

  @Override
  public ScoreOutcome score(ScoreInput in) {
    List<FactorContribution> factors = new ArrayList<>();

    // KYC: tier 0..3 → 0..1 (null = unverified = 0).
    BigDecimal kyc = in.kycLevel() == null ? BigDecimal.ZERO
      : clamp(BigDecimal.valueOf(in.kycLevel()).divide(BigDecimal.valueOf(3), 4, RoundingMode.HALF_UP));
    // Payment reliability: null = neutral 0.5 (no track record).
    BigDecimal payment = in.onTimePaymentRate() == null ? new BigDecimal("0.5") : clamp(in.onTimePaymentRate());
    // Dispute rate inverted: null = 0 disputes = full credit.
    BigDecimal dispute = BigDecimal.ONE.subtract(in.disputeRate() == null ? BigDecimal.ZERO : clamp(in.disputeRate()));
    // Activity: null = neutral 0.5.
    BigDecimal activity = in.activityScore() == null ? new BigDecimal("0.5") : clamp(in.activityScore());
    // Tenure: months / saturation, capped at 1.
    int satMonths = Math.max(1, props.getTenureSaturationMonths());
    BigDecimal tenure = in.tenureMonths() == null ? BigDecimal.ZERO
      : clamp(BigDecimal.valueOf(in.tenureMonths()).divide(BigDecimal.valueOf(satMonths), 4, RoundingMode.HALF_UP));
    // Compliance: any sanctions/watchlist hit zeroes it; otherwise clean = 1.
    BigDecimal compliance = (in.sanctionsHits() != null && in.sanctionsHits() > 0) ? BigDecimal.ZERO : BigDecimal.ONE;

    BigDecimal weighted = BigDecimal.ZERO;
    weighted = weighted.add(addFactor(factors, "kyc", props.getWeightKyc(), kyc));
    weighted = weighted.add(addFactor(factors, "paymentReliability", props.getWeightPaymentReliability(), payment));
    weighted = weighted.add(addFactor(factors, "disputeRate", props.getWeightDisputeRate(), dispute));
    weighted = weighted.add(addFactor(factors, "activity", props.getWeightActivity(), activity));
    weighted = weighted.add(addFactor(factors, "tenure", props.getWeightTenure(), tenure));
    weighted = weighted.add(addFactor(factors, "compliance", props.getWeightCompliance(), compliance));

    int score = weighted.multiply(BigDecimal.valueOf(1000)).setScale(0, RoundingMode.HALF_UP).intValue();
    score = Math.max(0, Math.min(1000, score));
    String band = band(score);
    return new ScoreOutcome(score, band, factors);
  }

  private BigDecimal addFactor(List<FactorContribution> factors, String name, BigDecimal weight, BigDecimal value) {
    BigDecimal w = weight != null ? weight : BigDecimal.ZERO;
    BigDecimal contribution = w.multiply(value);
    int points = contribution.multiply(BigDecimal.valueOf(1000)).setScale(0, RoundingMode.HALF_UP).intValue();
    factors.add(new FactorContribution(name, w, value.setScale(4, RoundingMode.HALF_UP), points));
    return contribution;
  }

  private String band(int score) {
    if (score >= 850) return "EXCELLENT";
    if (score >= 700) return "HIGH";
    if (score >= 500) return "MEDIUM";
    if (score >= 300) return "LOW";
    return "VERY_LOW";
  }

  private BigDecimal clamp(BigDecimal v) {
    if (v == null) return BigDecimal.ZERO;
    if (v.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO;
    if (v.compareTo(BigDecimal.ONE) > 0) return BigDecimal.ONE;
    return v;
  }

  @Override
  public String providerName() {
    return "simulated";
  }
}
