package com.baalvion.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/** A single-currency credit/debit request against a wallet. */
@Data
public class MoneyRequest {

  private String idempotencyKey;

  @NotBlank
  @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code")
  private String currency;

  @NotNull
  @DecimalMin(value = "0.0001", message = "amount must be positive")
  private BigDecimal amount;

  private String reference;
}
