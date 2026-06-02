package com.baalvion.trustscore.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request to (re)compute a subject's trust score from the supplied signals. Signals are optional —
 * the scoring engine substitutes neutral/benign defaults for any that are absent.
 */
@Data
public class ComputeRequest {

  @NotNull(message = "subjectId is required")
  private UUID subjectId;

  @NotBlank(message = "subjectType is required")
  private String subjectType; // CUSTOMER, SUPPLIER, ORGANIZATION, COUNTERPARTY

  private String subjectName;

  /** KYC tier 0..3 (0 = unverified). */
  private Integer kycLevel;

  /** Fraction of obligations paid on time, 0..1. */
  private BigDecimal onTimePaymentRate;

  /** Fraction of transactions disputed, 0..1. */
  private BigDecimal disputeRate;

  /** Normalized trading-activity strength, 0..1. */
  private BigDecimal activityScore;

  /** Account age in months. */
  private Integer tenureMonths;

  /** Count of sanctions/watchlist hits (any > 0 zeroes the compliance factor). */
  private Integer sanctionsHits;

  /** Why the score is being (re)computed — recorded in history. */
  private String reason;
}
