package com.baalvion.payment.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ApprovalRequest: a maker-checker (4-eyes) authorization record (design §7.1).
 *
 * High-value/sensitive operations are not executed directly; a maker raises a PENDING
 * request and a different checker must approve it before the operation runs. The {@code maker}
 * and {@code checker} must differ.
 */
@Entity
@Table(
  name = "approval_requests",
  schema = "payments",
  indexes = {
    @Index(name = "idx_approval_tenant_status", columnList = "tenant_id,status,created_at DESC"),
    @Index(name = "idx_approval_resource", columnList = "tenant_id,resource_id")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequest {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  /** Operation type, e.g. PAYMENT_REVERSAL. */
  @Column(length = 48, nullable = false)
  private String operation;

  /** Id of the resource the operation acts on (e.g. the transaction id). */
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID resourceId;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String payload;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Status status;

  @Column(length = 128, nullable = false)
  private String makerId;

  @Column(length = 128)
  private String checkerId;

  @Column(columnDefinition = "TEXT")
  private String decisionReason;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Column
  private LocalDateTime decidedAt;

  @Version
  private Long version;

  public enum Status {
    PENDING,
    APPROVED,
    REJECTED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (payload == null) {
      payload = "{}";
    }
    if (status == null) {
      status = Status.PENDING;
    }
  }
}
