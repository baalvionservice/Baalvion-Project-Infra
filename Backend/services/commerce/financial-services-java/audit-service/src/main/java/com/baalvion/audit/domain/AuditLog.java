package com.baalvion.audit.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * AuditLog: One immutable, append-only audit entry.
 *
 * Has no {@code updatedAt} / {@code @Version} — entries are written once and never
 * mutated. {@code payload} is JSONB (GIN-indexed) holding the full event body.
 */
@Entity
@Table(
  name = "audit_logs",
  schema = "audit",
  indexes = {
    @Index(name = "idx_tenant_created", columnList = "tenant_id,created_at DESC"),
    @Index(name = "idx_tenant_event_type", columnList = "tenant_id,event_type,created_at DESC"),
    @Index(name = "idx_tenant_aggregate", columnList = "tenant_id,aggregate_id"),
    @Index(name = "idx_trace", columnList = "trace_id")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull(message = "Tenant ID required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank(message = "Event type required")
  @Size(max = 128)
  @Column(length = 128, nullable = false)
  private String eventType;

  @Size(max = 64)
  @Column(length = 64)
  private String aggregateType;

  @Size(max = 128)
  @Column(length = 128)
  private String aggregateId;

  @Size(max = 64)
  @Column(length = 64)
  private String action;

  @Size(max = 128)
  @Column(length = 128)
  private String actor;

  /** Origin of the entry: a service name, "api", or "kafka". */
  @Size(max = 64)
  @Column(length = 64)
  private String source;

  /** Correlation id (X-Trace-Id) propagated across services. */
  @Size(max = 64)
  @Column(length = 64)
  private String traceId;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String payload;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (payload == null) {
      payload = "{}";
    }
  }
}
