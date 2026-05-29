package com.baalvion.risk.service;

import com.baalvion.risk.domain.RiskAssessment.Decision;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Rule-based fraud scorer. Each rule that fires adds to the score; the total maps to a
 * decision. Thresholds are configurable via {@code app.risk.*}.
 */
@Component
public class RiskEngine {

  @Value("${app.risk.high-value-threshold:250000}")
  private BigDecimal highValueThreshold;

  @Value("${app.risk.velocity-count-threshold:5}")
  private long velocityCountThreshold;

  @Value("${app.risk.velocity-amount-threshold:500000}")
  private BigDecimal velocityAmountThreshold;

  @Value("${app.risk.review-score:40}")
  private int reviewScore;

  @Value("${app.risk.decline-score:70}")
  private int declineScore;

  public record Result(int score, Decision decision, String reasons) {}

  public Result evaluate(BigDecimal amount, long recentCount, BigDecimal recentAmount) {
    int score = 0;
    List<String> reasons = new ArrayList<>();

    if (amount.compareTo(highValueThreshold) >= 0) {
      score += 40;
      reasons.add("HIGH_VALUE");
    }
    if (recentCount >= velocityCountThreshold) {
      score += 40;
      reasons.add("HIGH_VELOCITY");
    }
    if (recentAmount.add(amount).compareTo(velocityAmountThreshold) >= 0) {
      score += 30;
      reasons.add("VELOCITY_AMOUNT");
    }

    Decision decision;
    if (score >= declineScore) {
      decision = Decision.DECLINE;
    } else if (score >= reviewScore) {
      decision = Decision.REVIEW;
    } else {
      decision = Decision.APPROVE;
    }
    return new Result(score, decision, reasons.isEmpty() ? "CLEAN" : String.join(",", reasons));
  }
}
