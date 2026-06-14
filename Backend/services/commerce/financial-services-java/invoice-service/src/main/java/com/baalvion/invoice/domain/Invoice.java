package com.baalvion.invoice.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Invoice: Multi-tenant invoice header.
 *
 * Represents a single receivable or payable invoice. Carries the monetary breakdown
 * ({@code subtotal}, {@code taxAmount}, {@code total}, {@code amountPaid}) and runs the
 * invoice lifecycle state machine via {@link Status}. Line items are persisted in a
 * separate table (see {@link InvoiceLineItem}); every state change is appended to the
 * {@link InvoiceEvent} audit log.
 */
@Entity
@Table(
  name = "invoices",
  schema = "invoice",
  indexes = {
    @Index(name = "idx_invoice_tenant_dir_status", columnList = "tenant_id,direction,status"),
    @Index(name = "idx_invoice_tenant_due", columnList = "tenant_id,due_date"),
    @Index(name = "idx_invoice_tenant_created", columnList = "tenant_id,created_at DESC")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_invoice_number_tenant", columnNames = {"tenant_id", "invoice_number"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull(message = "Tenant ID required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank(message = "Invoice number required")
  @Size(max = 40, message = "Invoice number must not exceed 40 characters")
  @Column(name = "invoice_number", length = 40, nullable = false)
  private String invoiceNumber;

  @NotNull(message = "Direction required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private Direction direction;

  @Size(max = 200, message = "Counterparty name must not exceed 200 characters")
  @Column(name = "counterparty_name", length = 200)
  private String counterpartyName;

  @Size(max = 128, message = "Counterparty ID must not exceed 128 characters")
  @Column(name = "counterparty_id", length = 128)
  private String counterpartyId;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  @Column(length = 3, nullable = false)
  private String currency;

  @NotNull(message = "Subtotal required")
  @Digits(integer = 15, fraction = 4, message = "Subtotal must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal subtotal;

  @NotNull(message = "Tax amount required")
  @Digits(integer = 15, fraction = 4, message = "Tax amount must have max 15 digits and 4 decimals")
  @Column(name = "tax_amount", precision = 19, scale = 4, nullable = false)
  private BigDecimal taxAmount;

  @NotNull(message = "Total required")
  @Digits(integer = 15, fraction = 4, message = "Total must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal total;

  @NotNull(message = "Amount paid required")
  @Digits(integer = 15, fraction = 4, message = "Amount paid must have max 15 digits and 4 decimals")
  @Column(name = "amount_paid", precision = 19, scale = 4, nullable = false)
  private BigDecimal amountPaid;

  @NotNull(message = "Status required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 24)
  private Status status;

  @Column(name = "issue_date")
  private LocalDate issueDate;

  @Column(name = "due_date")
  private LocalDate dueDate;

  @Size(max = 128, message = "Order ID must not exceed 128 characters")
  @Column(name = "order_id", length = 128)
  private String orderId;

  @Column(columnDefinition = "text")
  private String notes;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String metadata;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  /** Receivable (we are owed) vs payable (we owe). */
  public enum Direction {
    RECEIVABLE,
    PAYABLE
  }

  public enum Status {
    DRAFT,
    ISSUED,
    PARTIALLY_PAID,
    PAID,
    OVERDUE,
    CANCELLED,
    DISPUTED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (metadata == null) {
      metadata = "{}";
    }
    if (subtotal == null) {
      subtotal = BigDecimal.ZERO;
    }
    if (taxAmount == null) {
      taxAmount = BigDecimal.ZERO;
    }
    if (total == null) {
      total = BigDecimal.ZERO;
    }
    if (amountPaid == null) {
      amountPaid = BigDecimal.ZERO;
    }
    if (status == null) {
      status = Status.DRAFT;
    }
  }
}
