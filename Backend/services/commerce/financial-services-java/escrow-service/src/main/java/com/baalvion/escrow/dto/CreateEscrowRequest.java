package com.baalvion.escrow.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEscrowRequest {

  @NotBlank(message = "Escrow reference required")
  @Size(max = 64, message = "Escrow reference must not exceed 64 characters")
  private String escrowRef;

  @NotNull(message = "Source account required")
  private UUID sourceAccountId;

  @NotNull(message = "Beneficiary account required")
  private UUID beneficiaryAccountId;

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
  @Digits(integer = 15, fraction = 4, message = "Amount must have max 15 digits and 4 decimals")
  private BigDecimal amount;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  private String currency;

  @NotBlank(message = "Release condition required")
  private String releaseCondition;

  /** Required when releaseCondition = TIME_BASED. */
  private LocalDateTime releaseAt;

  /** For TIME_BASED holds: auto-release (true) or auto-refund (false) at expiry. Defaults to true. */
  private Boolean autoReleaseOnExpiry;

  private String metadata;
}
