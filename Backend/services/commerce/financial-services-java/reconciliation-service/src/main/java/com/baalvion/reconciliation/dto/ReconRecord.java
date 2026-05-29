package com.baalvion.reconciliation.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * A single reconciliation record (used for both internal and external sides).
 * Keyed by {@code transactionRef}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconRecord {

  @NotBlank(message = "Transaction reference required")
  @Size(max = 64)
  private String transactionRef;

  @NotNull(message = "Amount required")
  @Digits(integer = 15, fraction = 4)
  private BigDecimal amount;
}
