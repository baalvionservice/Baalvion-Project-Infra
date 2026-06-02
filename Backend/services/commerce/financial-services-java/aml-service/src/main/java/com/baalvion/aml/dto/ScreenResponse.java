package com.baalvion.aml.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Outcome of a screen call. {@code alertRaised=false} means the transaction passed (no rules fired,
 * grade LOW) and no alert row was persisted; otherwise {@code alert} carries the open case.
 */
@Data
@Builder
public class ScreenResponse {
  private boolean alertRaised;
  private BigDecimal riskScore;
  private String riskGrade;
  private List<RuleHitView> triggeredRules;
  private AlertResponse alert;

  @Data
  @Builder
  public static class RuleHitView {
    private String code;
    private String name;
    private int points;
  }
}
