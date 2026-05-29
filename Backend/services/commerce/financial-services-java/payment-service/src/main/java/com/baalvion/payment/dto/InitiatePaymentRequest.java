package com.baalvion.payment.dto;

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
public class InitiatePaymentRequest {

  @NotBlank(message = "Idempotency key required")
  @Size(max = 128, message = "Idempotency key must not exceed 128 characters")
  private String idempotencyKey;

  @NotNull(message = "Source account required")
  private UUID sourceAccountId;

  @NotNull(message = "Destination account required")
  private UUID destinationAccountId;

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
  @Digits(integer = 15, fraction = 2, message = "Amount must have max 15 digits and 2 decimals")
  private BigDecimal amount;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  private String currency;

  @NotBlank(message = "Payment scheme required")
  private String paymentScheme;

  private String metadata;
}
