package com.baalvion.aml.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/** Typed configuration for AML thresholds + FATF lists ({@code app.aml}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.aml")
public class AmlProperties {

  /** High-value/reporting threshold (currency-agnostic). */
  private BigDecimal reportingThreshold = new BigDecimal("10000");

  /** Structuring band: amounts within this fraction below the threshold look like smurfing. */
  private BigDecimal structuringBand = new BigDecimal("0.10");

  /** A round amount at/above this unit is suspicious. */
  private BigDecimal roundAmountUnit = new BigDecimal("10000");

  /** FATF "call for action" (high-risk) jurisdictions — ISO 3166-1 alpha-2. */
  private List<String> highRiskCountries = List.of("IR", "KP", "MM");

  /** FATF "increased monitoring" (grey) jurisdictions. */
  private List<String> greyListCountries = List.of("SY", "YE", "SS", "HT", "CD", "ML", "MZ");

  /** Active screening provider: "simulated" (built-in rules) or "vendor". */
  private String provider = "simulated";
}
