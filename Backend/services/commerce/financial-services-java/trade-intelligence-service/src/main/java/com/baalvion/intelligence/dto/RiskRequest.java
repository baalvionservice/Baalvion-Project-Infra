package com.baalvion.intelligence.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

/** Assess a supplier's default risk from supplied signals. */
@Data
public class RiskRequest {

  @NotNull
  private UUID supplierId;

  private String supplierName;

  /**
   * Risk signals, e.g. { onTimeDeliveryPct, disputeRatePct, financialHealth, yearsActive }.
   * Missing signals fall back to neutral defaults.
   */
  private Map<String, Object> signals;
}
