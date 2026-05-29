package com.baalvion.risk.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * RiskAssessment: the scored fraud/risk decision for one transaction.
 */
@Entity
@Table(
  name = "risk_assessments",
  schema = "risk",
  indexes = {
    @Index(name = "idx_risk_tenant_source_created", columnList = "tenant_id,source_account_id,created_at DESC"),
    @Index(name = "idx_risk_tenant_decision", columnList = "tenant_id,decision,created_at DESC"),
    @Index(name = "idx_risk_txn", columnList = "tenant_id,transaction_id")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_risk_txn", columnNames = {"transaction_id", "tenant_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessment {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID transactionId;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID sourceAccountId;

  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal amount;

  @Column(length = 3, nullable = false)
  private String currency;

  @Column(length = 32)
  private String scheme;

  @Column(nullable = false)
  private int score;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Decision decision;

  /** Comma-separated rule codes that fired (e.g., HIGH_VALUE,HIGH_VELOCITY). */
  @Column(columnDefinition = "TEXT")
  private String reasons;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public enum Decision {
    APPROVE,
    REVIEW,
    DECLINE
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }
}
