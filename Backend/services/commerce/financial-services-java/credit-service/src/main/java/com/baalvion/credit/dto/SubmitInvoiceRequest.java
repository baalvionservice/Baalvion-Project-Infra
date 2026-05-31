package com.baalvion.credit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Submit a receivable for financing. The platform assesses risk and proposes an advance. */
@Data
public class SubmitInvoiceRequest {

  private String idempotencyKey;

  @NotBlank
  private String invoiceNumber;

  private UUID sellerId;

  @NotBlank
  private String sellerName;

  private UUID debtorId;

  @NotBlank
  private String debtorName;

  @NotNull
  @DecimalMin(value = "0.0001", message = "faceAmount must be positive")
  private BigDecimal faceAmount;

  @NotBlank
  @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code")
  private String currency;

  private LocalDate issueDate;

  @NotNull
  private LocalDate dueDate;

  /** Optional requested advance rate; capped by the risk-based maximum. */
  private BigDecimal requestedAdvanceRate;

  private String metadata;
}
