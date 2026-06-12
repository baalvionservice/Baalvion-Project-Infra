package com.baalvion.invoice.dto;

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
public class InvoiceLineItemDto {

  /** Populated on responses; ignored on create requests. */
  private UUID id;

  @Size(max = 500, message = "Description must not exceed 500 characters")
  private String description;

  @NotNull(message = "Quantity required")
  @DecimalMin(value = "0.0000", inclusive = false, message = "Quantity must be positive")
  @Digits(integer = 15, fraction = 4, message = "Quantity must have max 15 digits and 4 decimals")
  private BigDecimal quantity;

  @NotNull(message = "Unit price required")
  @DecimalMin(value = "0.00", message = "Unit price must be non-negative")
  @Digits(integer = 15, fraction = 4, message = "Unit price must have max 15 digits and 4 decimals")
  private BigDecimal unitPrice;

  /** Computed server-side (quantity * unitPrice); populated on responses. */
  private BigDecimal lineTotal;
}
