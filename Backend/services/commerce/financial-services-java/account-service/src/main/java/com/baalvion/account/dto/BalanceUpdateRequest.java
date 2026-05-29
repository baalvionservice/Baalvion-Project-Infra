package com.baalvion.account.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Internal balance movement applied by the ledger/payment services once a journal
 * entry posts. {@code reference} is the originating transaction reference and makes
 * the operation idempotent at the caller's discretion.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceUpdateRequest {

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
  @Digits(integer = 15, fraction = 4, message = "Amount must have max 15 digits and 4 decimals")
  private BigDecimal amount;

  @Size(max = 64, message = "Reference must not exceed 64 characters")
  private String reference;
}
