package com.baalvion.tradefinance.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An independent (demand) guarantee or standby undertaking, typically governed by URDG 758 or
 * ISP98. The guarantor pays the beneficiary on a complying demand, independent of the underlying
 * contract. Issuance creates a contingent liability on the applicant (principal).
 */
@Entity
@Table(name = "bank_guarantees", schema = "trade_finance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankGuarantee {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "guarantee_number", nullable = false, length = 40)
  private String guaranteeNumber;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Enumerated(EnumType.STRING)
  @Column(name = "guarantee_type", nullable = false, length = 20)
  private GuaranteeType guaranteeType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private GuaranteeStatus status = GuaranteeStatus.DRAFT;

  @Column(name = "applicant_id", columnDefinition = "uuid")
  private UUID applicantId;

  @Column(name = "applicant_name", nullable = false, length = 255)
  private String applicantName;

  @Column(name = "beneficiary_id", columnDefinition = "uuid")
  private UUID beneficiaryId;

  @Column(name = "beneficiary_name", nullable = false, length = 255)
  private String beneficiaryName;

  @Column(name = "guarantor_bank", length = 255)
  private String guarantorBank;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(name = "claimed_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal claimedAmount = BigDecimal.ZERO;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(name = "underlying_contract_ref", length = 255)
  private String underlyingContractRef;

  @Column(columnDefinition = "TEXT")
  private String purpose;

  @Enumerated(EnumType.STRING)
  @Column(name = "governing_rules", nullable = false, length = 20)
  @Builder.Default
  private GoverningRules governingRules = GoverningRules.URDG_758;

  @Column(name = "effective_date")
  private LocalDate effectiveDate;

  @Column(name = "expiry_date", nullable = false)
  private LocalDate expiryDate;

  @Column(name = "auto_extend", nullable = false)
  @Builder.Default
  private boolean autoExtend = false;

  @Column(name = "commission_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal commissionAmount = BigDecimal.ZERO;

  @Column(name = "margin_rate", nullable = false, precision = 6, scale = 4)
  @Builder.Default
  private BigDecimal marginRate = BigDecimal.ZERO;

  @Column(name = "margin_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal marginAmount = BigDecimal.ZERO;

  @Column(name = "scheme_ref", length = 100)
  private String schemeRef;

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

  @Column(name = "issued_at")
  private LocalDateTime issuedAt;

  public enum GuaranteeType { BID_BOND, PERFORMANCE, ADVANCE_PAYMENT, FINANCIAL, RETENTION, WARRANTY }

  public enum GoverningRules { URDG_758, ISP98, LOCAL }

  /**
   * DRAFT → ISSUED → (AMENDED) → (CLAIMED → CLAIM_PAID|CLAIM_REJECTED) → terminal:
   * RELEASED, EXPIRED, CANCELLED, CLAIM_PAID.
   */
  public enum GuaranteeStatus { DRAFT, ISSUED, AMENDED, CLAIMED, CLAIM_PAID, CLAIM_REJECTED, EXPIRED, CANCELLED, RELEASED }
}
