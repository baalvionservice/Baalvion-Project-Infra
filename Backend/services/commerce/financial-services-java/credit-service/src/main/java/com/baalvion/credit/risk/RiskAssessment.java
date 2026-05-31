package com.baalvion.credit.risk;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/** Output of a credit-risk assessment: grade, score, approval and recommended pricing. */
@Data
@Builder
public class RiskAssessment {
  private int score;          // 0..1000
  private RiskGrade grade;
  private boolean approved;
  /** Recommended cap on the invoice advance fraction for this risk (0 when declined). */
  private BigDecimal maxAdvanceRate;
  /** Pricing multiplier applied to the base finance rate (higher risk → higher price). */
  private BigDecimal pricingMultiplier;
  private String rationale;
}
