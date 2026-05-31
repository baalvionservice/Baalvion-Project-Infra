package com.baalvion.credit.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Typed configuration for credit pricing and risk policy ({@code app.credit}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.credit")
public class CreditProperties {

  /** Invoice finance: default advance fraction of face value. */
  private BigDecimal invoiceDefaultAdvanceRate = new BigDecimal("0.80");

  /** Invoice finance: maximum advance fraction we will fund. */
  private BigDecimal invoiceMaxAdvanceRate = new BigDecimal("0.90");

  /** Invoice finance: annualised discount/finance fee, applied pro-rata to the tenor. */
  private BigDecimal invoiceAnnualFeeRate = new BigDecimal("0.18");

  /** BNPL: annualised finance charge. */
  private BigDecimal bnplAnnualInterestRate = new BigDecimal("0.24");

  /** BNPL: late fee fraction of the overdue installment, applied per overdue sweep. */
  private BigDecimal bnplLateFeeRate = new BigDecimal("0.02");

  /** Days overdue before an invoice/plan is defaulted / written off. */
  private int defaultAfterDays = 90;

  /** Credit-bureau provider: "internal" (rules engine only) or "bureau". */
  private String creditBureauProvider = "internal";
}
