package com.baalvion.credit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/** Record a buyer repayment against a BNPL plan; allocated to the earliest owing installments. */
@Data
public class RepaymentRequest {

  @NotNull
  @DecimalMin(value = "0.0001", message = "amount must be positive")
  private BigDecimal amount;

  private String reference;
}
