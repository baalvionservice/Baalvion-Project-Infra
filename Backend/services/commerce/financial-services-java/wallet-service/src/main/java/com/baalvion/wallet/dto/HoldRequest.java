package com.baalvion.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/** Reserve funds within a balance for later capture or release. */
@Data
public class HoldRequest {

  @NotBlank
  @Size(min = 3, max = 3)
  private String currency;

  @NotNull
  @DecimalMin(value = "0.0001", message = "amount must be positive")
  private BigDecimal amount;

  private String reference;

  /** Optional validity in minutes; defaults to the configured platform value. */
  private Long ttlMinutes;
}
