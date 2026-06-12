package com.baalvion.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateInvoiceRequest {

  @NotBlank(message = "Direction required")
  private String direction;            // RECEIVABLE | PAYABLE

  @Size(max = 200, message = "Counterparty name must not exceed 200 characters")
  private String counterpartyName;

  @Size(max = 128, message = "Counterparty ID must not exceed 128 characters")
  private String counterpartyId;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  private String currency;

  @NotEmpty(message = "At least one line item is required")
  @Valid
  private List<InvoiceLineItemDto> lineItems;

  @DecimalMin(value = "0.00", message = "Tax amount must be non-negative")
  @Digits(integer = 15, fraction = 4, message = "Tax amount must have max 15 digits and 4 decimals")
  private BigDecimal taxAmount;

  private LocalDate dueDate;

  @Size(max = 128, message = "Order ID must not exceed 128 characters")
  private String orderId;

  private String notes;

  private String metadata;
}
