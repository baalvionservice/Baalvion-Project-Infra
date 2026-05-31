package com.baalvion.credit.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A receivable submitted for financing (factoring / invoice discounting). The financier advances
 * a fraction of {@link #faceAmount} to the seller, charges a discount fee for the tenor, and on
 * collection from the debtor recovers the advance + fee and remits the reserve to the seller.
 */
@Entity
@Table(name = "financed_invoices", schema = "credit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancedInvoice {

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

  @Column(name = "invoice_number", nullable = false, length = 120)
  private String invoiceNumber;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private InvoiceStatus status = InvoiceStatus.SUBMITTED;

  @Column(name = "seller_id", columnDefinition = "uuid")
  private UUID sellerId;

  @Column(name = "seller_name", nullable = false, length = 255)
  private String sellerName;

  @Column(name = "debtor_id", columnDefinition = "uuid")
  private UUID debtorId;

  @Column(name = "debtor_name", nullable = false, length = 255)
  private String debtorName;

  @Column(name = "face_amount", nullable = false, precision = 19, scale = 4)
  private BigDecimal faceAmount;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(name = "issue_date")
  private LocalDate issueDate;

  @Column(name = "due_date", nullable = false)
  private LocalDate dueDate;

  @Column(name = "advance_rate", nullable = false, precision = 9, scale = 6)
  @Builder.Default
  private BigDecimal advanceRate = BigDecimal.ZERO;

  @Column(name = "advance_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal advanceAmount = BigDecimal.ZERO;

  @Column(name = "fee_rate", nullable = false, precision = 9, scale = 6)
  @Builder.Default
  private BigDecimal feeRate = BigDecimal.ZERO;

  @Column(name = "fee_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal feeAmount = BigDecimal.ZERO;

  @Column(name = "reserve_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal reserveAmount = BigDecimal.ZERO;

  @Column(name = "collected_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal collectedAmount = BigDecimal.ZERO;

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

  @Column(name = "funded_at")
  private LocalDateTime fundedAt;

  @Column(name = "collected_at")
  private LocalDateTime collectedAt;

  /** SUBMITTED → ASSESSED → APPROVED → FUNDED → (COLLECTED | OVERDUE → DEFAULTED); or REJECTED. */
  public enum InvoiceStatus { SUBMITTED, ASSESSED, APPROVED, REJECTED, FUNDED, COLLECTED, OVERDUE, DEFAULTED }
}
