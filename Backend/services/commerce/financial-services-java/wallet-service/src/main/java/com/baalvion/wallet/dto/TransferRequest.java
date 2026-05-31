package com.baalvion.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/** Move funds in one currency from this wallet to another wallet. */
@Data
public class TransferRequest {

  private String idempotencyKey;

  @NotNull
  private UUID destinationWalletId;

  @NotBlank
  @Size(min = 3, max = 3)
  private String currency;

  @NotNull
  @DecimalMin(value = "0.0001", message = "amount must be positive")
  private BigDecimal amount;

  private String reference;
}
