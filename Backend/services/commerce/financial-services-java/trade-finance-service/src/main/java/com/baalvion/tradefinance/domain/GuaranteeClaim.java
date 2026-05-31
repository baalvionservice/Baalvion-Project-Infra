package com.baalvion.tradefinance.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A demand (claim) made by the beneficiary under a bank guarantee. Under URDG 758 the guarantor
 * examines the demand against the guarantee terms (a complying statement of default) and either
 * pays or rejects with reasons.
 */
@Entity
@Table(name = "guarantee_claims", schema = "trade_finance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuaranteeClaim {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "guarantee_id", nullable = false, columnDefinition = "uuid")
  private UUID guaranteeId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "claim_number", nullable = false)
  private int claimNumber;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private ClaimStatus status = ClaimStatus.SUBMITTED;

  @Column(name = "claim_amount", nullable = false, precision = 19, scale = 4)
  private BigDecimal claimAmount;

  @Column(columnDefinition = "TEXT")
  private String statement;

  @Column(name = "supporting_documents", columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String supportingDocuments = "[]";

  @Column(name = "decision_reason", columnDefinition = "TEXT")
  private String decisionReason;

  @Column(name = "decided_by", length = 255)
  private String decidedBy;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "decided_at")
  private LocalDateTime decidedAt;

  @Column(name = "paid_at")
  private LocalDateTime paidAt;

  public enum ClaimStatus { SUBMITTED, UNDER_REVIEW, PAID, REJECTED }
}
