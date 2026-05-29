package com.baalvion.reconciliation.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ReconciliationItem: A single matched/unmatched record within a {@link ReconciliationRun}.
 *
 * Compares an internal amount against an external (scheme advice) amount for a given
 * transaction reference. Exceptions are routed to a resolution workflow.
 */
@Entity
@Table(
  name = "reconciliation_items",
  schema = "reconciliation",
  indexes = {
    @Index(name = "idx_run", columnList = "run_id,tenant_id"),
    @Index(name = "idx_tenant_status", columnList = "tenant_id,status"),
    @Index(name = "idx_tenant_txn_ref", columnList = "tenant_id,transaction_ref")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationItem {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotNull
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID runId;

  @Size(max = 64)
  @Column(length = 64)
  private String transactionRef;

  @Column(precision = 19, scale = 4)
  private BigDecimal internalAmount;

  @Column(precision = 19, scale = 4)
  private BigDecimal externalAmount;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ItemStatus status;

  @Column(columnDefinition = "TEXT")
  private String exceptionReason;

  @Size(max = 128)
  @Column(length = 128)
  private String resolvedBy;

  @Column
  private LocalDateTime resolvedAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  public enum ItemStatus {
    MATCHED,
    EXCEPTION,   // present on both sides but amounts differ
    UNMATCHED,   // present on only one side
    RESOLVED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }
}
