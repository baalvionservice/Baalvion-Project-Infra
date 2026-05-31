package com.baalvion.credit.risk;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Deterministic, explainable credit-risk scoring.
 *
 * This is a real rules-based model (the production starting point before ML): a base score is
 * adjusted by exposure size, tenor, counterparty repayment history and current exposure, then
 * graded A–E. When an external bureau score is supplied it is blended 50/50. The output drives
 * the approval decision, the invoice advance-rate cap, and the BNPL pricing multiplier.
 *
 * To augment with the platform's ml-service or a credit bureau, set
 * {@code app.credit.credit-bureau-provider=bureau} and populate {@link RiskInput#getBureauScore()}.
 */
@Slf4j
@Component
public class CreditRiskEngine {

  private static final int BASE_SCORE = 700;
  private static final BigDecimal LARGE_EXPOSURE = new BigDecimal("250000");

  public RiskAssessment assess(RiskInput in) {
    int score = BASE_SCORE;
    StringBuilder why = new StringBuilder("base=").append(BASE_SCORE);

    // Exposure size: larger single facilities carry more concentration risk.
    if (in.getAmount() != null && in.getAmount().compareTo(LARGE_EXPOSURE) > 0) {
      int penalty = (int) Math.min(120, 20.0 * Math.log10(
        in.getAmount().divide(LARGE_EXPOSURE, 4, RoundingMode.HALF_UP).doubleValue() + 1) / Math.log10(2));
      score -= penalty;
      why.append("; size-").append(penalty);
    }

    // Tenor: longer credit duration increases the probability of an adverse event.
    if (in.getTenorDays() > 60) {
      int penalty = Math.min(80, (in.getTenorDays() - 60) / 3);
      score -= penalty;
      why.append("; tenor-").append(penalty);
    }

    // Repayment history dominates: defaults hurt sharply, clean settlements build trust.
    if (in.getPriorDefaults() > 0) {
      int penalty = Math.min(300, in.getPriorDefaults() * 120);
      score -= penalty;
      why.append("; defaults-").append(penalty);
    }
    if (in.getPriorSettled() > 0) {
      int bonus = Math.min(120, in.getPriorSettled() * 25);
      score += bonus;
      why.append("; history+").append(bonus);
    }

    // High current outstanding exposure reduces additional appetite.
    if (in.getCurrentExposure() != null && in.getCurrentExposure().compareTo(LARGE_EXPOSURE) > 0) {
      score -= 50;
      why.append("; exposure-50");
    }

    // Blend an external bureau score when available.
    if (in.getBureauScore() >= 0) {
      score = (score + in.getBureauScore()) / 2;
      why.append("; bureau=").append(in.getBureauScore());
    }

    score = Math.max(0, Math.min(1000, score));
    RiskGrade grade = RiskGrade.fromScore(score);
    boolean approved = grade != RiskGrade.E;

    BigDecimal maxAdvance = switch (grade) {
      case A -> new BigDecimal("0.90");
      case B -> new BigDecimal("0.85");
      case C -> new BigDecimal("0.80");
      case D -> new BigDecimal("0.70");
      case E -> BigDecimal.ZERO;
    };
    BigDecimal pricingMultiplier = switch (grade) {
      case A -> new BigDecimal("0.80");
      case B -> new BigDecimal("1.00");
      case C -> new BigDecimal("1.25");
      case D -> new BigDecimal("1.60");
      case E -> new BigDecimal("2.00");
    };

    RiskAssessment assessment = RiskAssessment.builder()
      .score(score).grade(grade).approved(approved)
      .maxAdvanceRate(maxAdvance).pricingMultiplier(pricingMultiplier)
      .rationale(why.append(" => ").append(score).append("/").append(grade).toString())
      .build();
    log.debug("Risk assessed: {}", assessment.getRationale());
    return assessment;
  }
}
