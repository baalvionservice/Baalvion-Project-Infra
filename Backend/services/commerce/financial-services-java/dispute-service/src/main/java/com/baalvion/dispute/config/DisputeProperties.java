package com.baalvion.dispute.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Typed configuration for dispute SLAs and AI triage ({@code app.dispute}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.dispute")
public class DisputeProperties {

  /** Days a respondent has to answer before the dispute auto-escalates. */
  private int responseWindowDays = 7;

  /** Days a mediation stays open before it auto-escalates to arbitration. */
  private int mediationWindowDays = 14;

  /** Active AI-triage provider: "simulated" (default) or "ml-service". */
  private String aiProvider = "simulated";
}
