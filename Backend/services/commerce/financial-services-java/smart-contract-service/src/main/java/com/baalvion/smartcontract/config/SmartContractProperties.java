package com.baalvion.smartcontract.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Typed configuration for contract defaults and e-signature ({@code app.smart-contract}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.smart-contract")
public class SmartContractProperties {

  private String defaultGoverningLaw = "English Law";
  private String defaultDisputeResolution = "ICC Arbitration, single arbitrator, seat London";
  private int signatureExpiryDays = 14;

  /** Active e-signature provider: "simulated" (default) or "docuseal". */
  private String esignProvider = "simulated";
}
