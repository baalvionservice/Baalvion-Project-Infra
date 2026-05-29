package com.baalvion.settlement.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementItemRequest {

  @NotNull(message = "Transaction id required")
  private UUID transactionId;

  @Size(max = 64)
  private String transactionRef;

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.00", message = "Amount must be non-negative")
  @Digits(integer = 15, fraction = 4)
  private BigDecimal amount;

  @NotNull(message = "Fee required")
  @DecimalMin(value = "0.00", message = "Fee must be non-negative")
  @Digits(integer = 15, fraction = 4)
  private BigDecimal fee;
}
