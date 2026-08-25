package com.baalvion.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

/** Initiate a wallet top-up of the caller's own choosing (amount in major USD units). */
@Data
public class DepositRequest {

  @NotNull
  @DecimalMin(value = "1", message = "amount must be at least 1")
  private BigDecimal amount;

  @NotBlank
  @Pattern(regexp = "USDT_TRC20|ETH_BEP20|BTC", message = "asset must be USDT_TRC20, ETH_BEP20, or BTC")
  private String asset;
}
