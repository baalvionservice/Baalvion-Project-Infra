package com.baalvion.invoice.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * InvoiceEvent: append-only audit / status log. One row is written for every lifecycle
 * transition and every recorded payment (see service layer). Tenant-scoped via RLS; the
 * append-only invariant is enforced by a WORM trigger created in the migration (no UPDATE
 * or DELETE permitted), mirroring the platform's audit conventions.
 */
@Entity
@Table(
  name = "invoice_events",
  schema = "invoice",
  indexes = {
    @Index(name = "idx_invoice_event_invoice", columnList = "tenant_id,invoice_id"),
    @Index(name = "idx_invoice_event_created", columnList = "tenant_id,created_at DESC")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceEvent {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull(message = "Tenant ID required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotNull(message = "Invoice ID required")
  @Column(name = "invoice_id", columnDefinition = "uuid", nullable = false)
  private UUID invoiceId;

  @NotBlank(message = "Event type required")
  @Size(max = 48, message = "Event type must not exceed 48 characters")
  @Column(name = "event_type", length = 48, nullable = false)
  private String eventType;

  @Size(max = 24, message = "From status must not exceed 24 characters")
  @Column(name = "from_status", length = 24)
  private String fromStatus;

  @Size(max = 24, message = "To status must not exceed 24 characters")
  @Column(name = "to_status", length = 24)
  private String toStatus;

  @Size(max = 200, message = "Actor must not exceed 200 characters")
  @Column(length = 200)
  private String actor;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String detail;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (detail == null) {
      detail = "{}";
    }
  }
}
