package com.baalvion.aml.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An AML alert raised when a screened transaction trips one or more monitoring rules. Carries the
 * aggregate risk score + FATF-aligned grade and the rules that fired, and runs an investigate →
 * clear / escalate / file-SAR case workflow.
 */
@Entity
@Table(name = "aml_alerts", schema = "aml")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmlAlert {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Column(nullable = false, length = 40)
  private String reference;

  @Column(name = "subject_id", columnDefinition = "uuid")
  private UUID subjectId;
  @Column(name = "subject_name", length = 255)
  private String subjectName;

  @Column(name = "transaction_id", length = 128)
  private String transactionId;

  @Column(length = 10)
  private String direction;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(name = "counterparty_country", length = 2)
  private String counterpartyCountry;

  @Column(name = "risk_score", nullable = false, precision = 5, scale = 2)
  private BigDecimal riskScore;

  @Enumerated(EnumType.STRING)
  @Column(name = "risk_grade", nullable = false, length = 10)
  private RiskGrade riskGrade;

  @Column(name = "triggered_rules", columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String triggeredRules = "[]";

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  @Builder.Default
  private AlertStatus status = AlertStatus.OPEN;

  @Column(columnDefinition = "TEXT")
  private String findings;

  @Column(name = "assigned_to", length = 255)
  private String assignedTo;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String details = "{}";

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "resolved_at")
  private LocalDateTime resolvedAt;

  public enum RiskGrade { LOW, MEDIUM, HIGH, CRITICAL }

  public enum AlertStatus { OPEN, INVESTIGATING, CLEARED, ESCALATED, SAR_FILED }
}
