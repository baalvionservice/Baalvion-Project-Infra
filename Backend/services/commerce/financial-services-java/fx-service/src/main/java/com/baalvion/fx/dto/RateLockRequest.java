package com.baalvion.fx.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/** Request a firm rate-lock held for a validity window. */
@Data
public class RateLockRequest {

  private String idempotencyKey;

  @NotBlank
  @Size(min = 3, max = 3)
  private String sellCurrency;

  @NotBlank
  @Size(min = 3, max = 3)
  private String buyCurrency;

  @NotNull
  @DecimalMin(value = "0.0001", message = "sellAmount must be positive")
  private BigDecimal sellAmount;

  /** Validity window in seconds; defaults to the configured platform value. */
  private Integer lockSeconds;
}
