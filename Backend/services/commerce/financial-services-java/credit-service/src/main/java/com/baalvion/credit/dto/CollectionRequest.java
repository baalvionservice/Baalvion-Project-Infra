package com.baalvion.credit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/** Record a payment received from the debtor against a financed invoice. */
@Data
public class CollectionRequest {

  @NotNull
  @DecimalMin(value = "0.0001", message = "amount must be positive")
  private BigDecimal amount;

  private String reference;
}
