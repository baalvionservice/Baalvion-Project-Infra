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
 * A documentary credit (Letter of Credit) governed by UCP 600. Issuing the credit creates a
 * contingent liability on the applicant; complying presentations draw down {@link #availableAmount}
 * and post real ledger settlement.
 */
@Entity
@Table(name = "letters_of_credit", schema = "trade_finance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LetterOfCredit {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "lc_number", nullable = false, length = 40)
  private String lcNumber;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Enumerated(EnumType.STRING)
  @Column(name = "lc_type", nullable = false, length = 20)
  private LcType lcType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private LcStatus status = LcStatus.DRAFT;

  @Column(name = "applicant_id", columnDefinition = "uuid")
  private UUID applicantId;

  @Column(name = "applicant_name", nullable = false, length = 255)
  private String applicantName;

  @Column(name = "beneficiary_id", columnDefinition = "uuid")
  private UUID beneficiaryId;

  @Column(name = "beneficiary_name", nullable = false, length = 255)
  private String beneficiaryName;

  @Column(name = "issuing_bank", length = 255)
  private String issuingBank;

  @Column(name = "advising_bank", length = 255)
  private String advisingBank;

  @Column(name = "confirming_bank", length = 255)
  private String confirmingBank;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(name = "available_amount", nullable = false, precision = 19, scale = 4)
  private BigDecimal availableAmount;

  @Column(name = "settled_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal settledAmount = BigDecimal.ZERO;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(name = "tolerance_pct", nullable = false, precision = 5, scale = 2)
  @Builder.Default
  private BigDecimal tolerancePct = BigDecimal.ZERO;

  @Column(length = 11)
  private String incoterm;

  @Column(name = "goods_description", columnDefinition = "TEXT")
  private String goodsDescription;

  @Column(name = "port_of_loading", length = 255)
  private String portOfLoading;

  @Column(name = "port_of_discharge", length = 255)
  private String portOfDischarge;

  @Column(name = "partial_shipment_allowed", nullable = false)
  @Builder.Default
  private boolean partialShipmentAllowed = false;

  @Column(name = "transhipment_allowed", nullable = false)
  @Builder.Default
  private boolean transhipmentAllowed = false;

  @Column(name = "latest_shipment_date")
  private LocalDate latestShipmentDate;

  @Column(name = "expiry_date", nullable = false)
  private LocalDate expiryDate;

  @Column(name = "expiry_place", length = 255)
  private String expiryPlace;

  @Column(name = "required_documents", columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String requiredDocuments = "[]";

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

  @Column(name = "settled_at")
  private LocalDateTime settledAt;

  public enum LcType { SIGHT, USANCE, DEFERRED, REVOLVING, TRANSFERABLE, STANDBY }

  /**
   * DRAFT → ISSUED → ADVISED → (AMENDED) → DOCS_PRESENTED → DOCS_ACCEPTED|DISCREPANT → SETTLED;
   * terminal: SETTLED, EXPIRED, CANCELLED.
   */
  public enum LcStatus { DRAFT, ISSUED, ADVISED, AMENDED, DOCS_PRESENTED, DOCS_ACCEPTED, DISCREPANT, SETTLED, EXPIRED, CANCELLED }
}
