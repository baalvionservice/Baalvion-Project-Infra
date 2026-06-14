package com.baalvion.invoice.domain;

import lombok.*;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * InvoiceLineItem: a single billable line on an invoice. Tenant-scoped (RLS) and linked to
 * its parent {@link Invoice} via {@code invoice_id}. The {@code lineTotal} is computed as
 * {@code quantity * unitPrice} at the service layer.
 */
@Entity
@Table(
  name = "invoice_line_items",
  schema = "invoice",
  indexes = {
    @Index(name = "idx_line_item_invoice", columnList = "tenant_id,invoice_id")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceLineItem {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull(message = "Tenant ID required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotNull(message = "Invoice ID required")
  @Column(name = "invoice_id", columnDefinition = "uuid", nullable = false)
  private UUID invoiceId;

  @Size(max = 500, message = "Description must not exceed 500 characters")
  @Column(length = 500)
  private String description;

  @NotNull(message = "Quantity required")
  @Digits(integer = 15, fraction = 4, message = "Quantity must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal quantity;

  @NotNull(message = "Unit price required")
  @Digits(integer = 15, fraction = 4, message = "Unit price must have max 15 digits and 4 decimals")
  @Column(name = "unit_price", precision = 19, scale = 4, nullable = false)
  private BigDecimal unitPrice;

  @NotNull(message = "Line total required")
  @Digits(integer = 15, fraction = 4, message = "Line total must have max 15 digits and 4 decimals")
  @Column(name = "line_total", precision = 19, scale = 4, nullable = false)
  private BigDecimal lineTotal;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }
}
