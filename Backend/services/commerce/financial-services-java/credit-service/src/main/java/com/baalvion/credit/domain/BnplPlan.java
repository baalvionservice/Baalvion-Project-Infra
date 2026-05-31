package com.baalvion.credit.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A trade Buy-Now-Pay-Later facility. The financier pays the merchant the {@link #principal}
 * up-front; the buyer repays over a bullet term or an installment schedule with a finance charge.
 */
@Entity
@Table(name = "bnpl_plans", schema = "credit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BnplPlan {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(nullable = false, length = 40)
  private String reference;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Column(name = "order_ref", length = 255)
  private String orderRef;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private BnplStatus status = BnplStatus.PENDING;

  @Column(name = "buyer_id", columnDefinition = "uuid")
  private UUID buyerId;

  @Column(name = "buyer_name", nullable = false, length = 255)
  private String buyerName;

  @Column(name = "merchant_id", columnDefinition = "uuid")
  private UUID merchantId;

  @Column(name = "merchant_name", nullable = false, length = 255)
  private String merchantName;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal principal;

  @Column(nullable = false, length = 3)
  private String currency;

  @Enumerated(EnumType.STRING)
  @Column(name = "term_type", nullable = false, length = 20)
  private TermType termType;

  @Column(name = "installment_count", nullable = false)
  @Builder.Default
  private int installmentCount = 1;

  @Column(name = "tenor_days", nullable = false)
  private int tenorDays;

  @Column(name = "interest_rate", nullable = false, precision = 9, scale = 6)
  @Builder.Default
  private BigDecimal interestRate = BigDecimal.ZERO;

  @Column(name = "interest_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal interestAmount = BigDecimal.ZERO;

  @Column(name = "total_payable", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal totalPayable = BigDecimal.ZERO;

  @Column(nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal outstanding = BigDecimal.ZERO;

  @Column(name = "late_fees", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal lateFees = BigDecimal.ZERO;

  @Column(name = "risk_grade", length = 2)
  private String riskGrade;

  @Column(name = "risk_score")
  private Integer riskScore;

  @Column(name = "risk_rationale", columnDefinition = "TEXT")
  private String riskRationale;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String metadata = "{}";

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "disbursed_at")
  private LocalDateTime disbursedAt;

  @Column(name = "settled_at")
  private LocalDateTime settledAt;

  public enum TermType { BULLET, INSTALLMENTS }

  /** PENDING → APPROVED → ACTIVE → (SETTLED | DELINQUENT → DEFAULTED → WRITTEN_OFF); or REJECTED/CANCELLED. */
  public enum BnplStatus { PENDING, APPROVED, REJECTED, ACTIVE, SETTLED, DELINQUENT, DEFAULTED, WRITTEN_OFF, CANCELLED }
}
