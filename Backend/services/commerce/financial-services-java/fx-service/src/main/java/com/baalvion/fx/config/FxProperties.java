package com.baalvion.fx.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Typed configuration for FX pricing and rate freshness ({@code app.fx}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.fx")
public class FxProperties {

  /** Dealer spread around the mid rate, in basis points (per side). */
  private int spreadBps = 25;

  /** Seconds a published rate is considered fresh (platform 30s standard). */
  private int rateTtlSeconds = 30;

  /** Default rate-lock validity window in seconds. */
  private int rateLockSeconds = 120;

  /** Cash margin blocked when booking a forward (fraction of notional). */
  private BigDecimal forwardMarginRate = new BigDecimal("0.05");

  /** Maximum tenor (days) allowed for a forward. */
  private int forwardMaxTenorDays = 365;

  /** Rate provider: "simulated" or "live". */
  private String rateProvider = "simulated";

  /** Snapshot refresh interval in ms. */
  private long refreshMs = 15000;
}
