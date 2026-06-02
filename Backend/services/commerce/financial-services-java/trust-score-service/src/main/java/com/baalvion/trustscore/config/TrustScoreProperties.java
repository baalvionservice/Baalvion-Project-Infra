package com.baalvion.trustscore.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Typed configuration for the trust-score weighted model ({@code app.trust-score}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.trust-score")
public class TrustScoreProperties {

  /** Active scoring provider: "simulated" (built-in weighted model) or "vendor". */
  private String provider = "simulated";

  /** Factor weights — should sum to 1.0. */
  private BigDecimal weightKyc = new BigDecimal("0.20");
  private BigDecimal weightPaymentReliability = new BigDecimal("0.25");
  private BigDecimal weightDisputeRate = new BigDecimal("0.20");
  private BigDecimal weightActivity = new BigDecimal("0.15");
  private BigDecimal weightTenure = new BigDecimal("0.10");
  private BigDecimal weightCompliance = new BigDecimal("0.10");

  /** Account age (months) at which the tenure factor saturates to 1.0. */
  private int tenureSaturationMonths = 24;
}
