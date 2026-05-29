package com.baalvion.ledger.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostEntryRequest {

  @NotBlank(message = "Transaction reference required")
  @Size(max = 64, message = "Transaction reference must not exceed 64 characters")
  private String transactionRef;

  @NotNull(message = "Debit account required")
  private UUID debitAccountId;

  @NotNull(message = "Credit account required")
  private UUID creditAccountId;

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
  @Digits(integer = 15, fraction = 4, message = "Amount must have max 15 digits and 4 decimals")
  private BigDecimal amount;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  private String currency;

  @NotBlank(message = "Entry type required")
  private String entryType;

  private String description;

  private String metadata;
}
