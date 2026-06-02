package com.baalvion.fx.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Book a forward contract: lock today's forward rate for settlement on a future value date. */
@Data
public class ForwardRequest {

  private String idempotencyKey;

  @NotBlank
  @Size(min = 3, max = 3)
  private String sellCurrency;

  @NotBlank
  @Size(min = 3, max = 3)
  private String buyCurrency;

  @NotNull
  @DecimalMin(value = "0.0001", message = "notionalAmount must be positive")
  private BigDecimal notionalAmount;

  @NotNull
  private LocalDate valueDate;
}
