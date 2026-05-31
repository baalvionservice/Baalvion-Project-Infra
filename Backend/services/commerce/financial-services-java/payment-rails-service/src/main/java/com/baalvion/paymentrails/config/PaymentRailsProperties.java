package com.baalvion.paymentrails.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Typed configuration for rail routing ({@code app.payment-rails}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.payment-rails")
public class PaymentRailsProperties {

  /** Default urgency when the caller sets none: STANDARD | INSTANT | PRIORITY. */
  private String defaultUrgency = "STANDARD";

  /** Above this amount a wholesale/wire rail is preferred over instant rails. */
  private BigDecimal highValueThreshold = new BigDecimal("100000");

  /** UPI per-transaction ceiling (INR); above it, fall back to SWIFT/wire. */
  private BigDecimal upiMaxAmount = new BigDecimal("100000");

  /** Active rail provider: "simulated" (default) or "psp". */
  private String railProvider = "simulated";
}
