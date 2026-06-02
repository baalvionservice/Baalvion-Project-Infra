package com.baalvion.intelligence.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Typed configuration for the intelligence provider ({@code app.trade-intelligence}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.trade-intelligence")
public class TradeIntelligenceProperties {

  /** Active inference provider: "simulated" (default) or "ml-service". */
  private String provider = "simulated";

  /** Base URL of the Python ml-service when provider=ml-service. */
  private String mlServiceUrl = "http://localhost:3033";

  /** Default forecast horizon in days. */
  private int defaultHorizonDays = 90;

  /** Supplier-risk score (0-100) at/above which the early-warning flag is set. */
  private int earlyWarningThreshold = 70;
}
