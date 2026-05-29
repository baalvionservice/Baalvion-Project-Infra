package com.baalvion.account.dto;

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
public class CreateAccountRequest {

  @Size(max = 140, message = "Account name must not exceed 140 characters")
  private String accountName;

  @NotBlank(message = "Account type required")
  private String accountType;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  private String currency;

  @DecimalMin(value = "0.00", message = "Daily limit must be non-negative")
  @Digits(integer = 15, fraction = 4, message = "Daily limit must have max 15 digits and 4 decimals")
  private BigDecimal dailyLimit;

  private String metadata;
}
