package com.baalvion.reconciliation.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ReconciliationRun: One reconciliation pass over an inbound settlement advice.
 *
 * Holds the aggregate outcome (matched / exception / unmatched counts) for a set of
 * {@link ReconciliationItem}s produced by matching external records against internal ones.
 */
@Entity
@Table(
  name = "reconciliation_runs",
  schema = "reconciliation",
  indexes = {
    @Index(name = "idx_tenant_status_date", columnList = "tenant_id,status,created_at DESC")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_run_ref", columnNames = {"run_ref", "tenant_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationRun {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank
  @Size(max = 64)
  @Column(length = 64, nullable = false)
  private String runRef;

  @Size(max = 128)
  @Column(length = 128)
  private String sourceFile;

  /** Optional link to the settlement batch this advice corresponds to. */
  @Size(max = 64)
  @Column(length = 64)
  private String batchRef;

  @Column(nullable = false)
  private int totalRecords;

  @Column(nullable = false)
  private int matchedCount;

  @Column(nullable = false)
  private int exceptionCount;

  @Column(nullable = false)
  private int unmatchedCount;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private RunStatus status;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  public enum RunStatus {
    COMPLETED,
    COMPLETED_WITH_EXCEPTIONS,
    RESOLVED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }
}
