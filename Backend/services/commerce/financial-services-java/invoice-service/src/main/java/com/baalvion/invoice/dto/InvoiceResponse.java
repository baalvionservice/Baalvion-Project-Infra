package com.baalvion.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {
  private UUID id;
  private UUID tenantId;
  private String invoiceNumber;
  private String direction;
  private String counterpartyName;
  private String counterpartyId;
  private String currency;
  private BigDecimal subtotal;
  private BigDecimal taxAmount;
  private BigDecimal total;
  private BigDecimal amountPaid;
  private BigDecimal amountDue;
  private String status;
  private LocalDate issueDate;
  private LocalDate dueDate;
  private String orderId;
  private String notes;
  private String metadata;
  private List<InvoiceLineItemDto> lineItems;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
