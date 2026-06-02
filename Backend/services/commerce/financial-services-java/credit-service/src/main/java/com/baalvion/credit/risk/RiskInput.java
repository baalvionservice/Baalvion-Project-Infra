package com.baalvion.credit.risk;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Inputs to a credit-risk assessment. Counts are the counterparty's prior behaviour within the
 * platform; an external bureau score (0..1000) may be supplied to blend with the internal model.
 */
@Data
@Builder
public class RiskInput {
  private BigDecimal amount;
  private int tenorDays;
  private String currency;
  /** Number of the counterparty's prior facilities that defaulted / were written off. */
  private int priorDefaults;
  /** Number of the counterparty's prior facilities settled in good standing. */
  private int priorSettled;
  /** Counterparty's current outstanding exposure on the platform. */
  private BigDecimal currentExposure;
  /** Optional external bureau score (0..1000); negative means "not available". */
  @Builder.Default
  private int bureauScore = -1;
}
