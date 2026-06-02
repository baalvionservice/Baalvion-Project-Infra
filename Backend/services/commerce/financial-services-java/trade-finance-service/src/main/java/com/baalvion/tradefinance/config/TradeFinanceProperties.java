package com.baalvion.tradefinance.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Typed configuration for trade-finance pricing and examination rules ({@code app.trade-finance}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.trade-finance")
public class TradeFinanceProperties {

  /** Issuance commission charged on instrument face value, in basis points (125 = 1.25%). */
  private int issuanceCommissionBps = 125;

  /** Default cash-margin / collateral fraction of face value blocked on the applicant. */
  private BigDecimal defaultMarginRate = new BigDecimal("0.10");

  /** UCP 600 art.14(b): banks have up to 5 banking days to examine a presentation. */
  private int documentExaminationDays = 5;

  /** Active issuing-bank provider: "simulated" (default) or "swift". */
  private String issuingBankProvider = "simulated";
}
