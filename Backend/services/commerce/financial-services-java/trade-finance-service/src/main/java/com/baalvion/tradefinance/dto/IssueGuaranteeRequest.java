package com.baalvion.tradefinance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Request to issue an independent bank guarantee / standby undertaking. */
@Data
public class IssueGuaranteeRequest {

  private String idempotencyKey;

  @NotBlank
  private String guaranteeType; // BID_BOND, PERFORMANCE, ADVANCE_PAYMENT, FINANCIAL, RETENTION, WARRANTY

  private UUID applicantId;

  @NotBlank
  private String applicantName;

  private UUID beneficiaryId;

  @NotBlank
  private String beneficiaryName;

  private String guarantorBank;

  @NotNull
  @DecimalMin(value = "0.0001", message = "amount must be positive")
  private BigDecimal amount;

  @NotBlank
  @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code")
  private String currency;

  private String underlyingContractRef;
  private String purpose;

  /** URDG_758 (default), ISP98, or LOCAL. */
  private String governingRules;

  private LocalDate effectiveDate;

  @NotNull
  private LocalDate expiryDate;

  /** "extend or pay" — guarantee auto-extends rather than expiring. */
  private boolean autoExtend;

  private BigDecimal marginRate;
  private String metadata;
}
