package com.baalvion.invoice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordPaymentRequest {

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.00", inclusive = false, message = "Amount must be positive")
  @Digits(integer = 15, fraction = 4, message = "Amount must have max 15 digits and 4 decimals")
  private BigDecimal amount;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  private String currency;

  @Size(max = 200, message = "Reference must not exceed 200 characters")
  private String reference;
}
