package com.baalvion.paymentrails.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/** Initiate an outbound (or record an inbound) payment for the rail router to clear. */
@Data
public class InitiatePaymentRequest {

  private String idempotencyKey;

  /** OUTBOUND (default) or INBOUND. */
  private String direction;

  private String debtorName;
  private String debtorAccount;
  private String debtorCountry;

  @NotBlank
  private String creditorName;
  private String creditorAccount;
  private String creditorBic;
  private String creditorRouting;

  @NotBlank
  @Size(min = 2, max = 2, message = "creditorCountry must be a 2-letter ISO code")
  private String creditorCountry;

  @NotNull
  @DecimalMin(value = "0.0001", message = "amount must be positive")
  private BigDecimal amount;

  @NotBlank
  @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code")
  private String currency;

  private String purpose;

  /** STANDARD (default), INSTANT, PRIORITY. */
  private String urgency;

  /** Optional rail preference (SWIFT, SEPA, ACH, UPI, PIX, MPESA, SPEI, PAYNOW, FPS, ...). */
  private String requestedRail;

  private String metadata;
}
