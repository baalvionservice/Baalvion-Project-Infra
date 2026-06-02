package com.baalvion.smartcontract.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A binding international sale contract assembled from Incoterms 2020 delivery clauses and UCP 600
 * payment clauses, executed via e-signature. EXECUTED contracts drive the order / trade-finance /
 * logistics services.
 */
@Entity
@Table(name = "trade_contracts", schema = "smart_contract")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeContract {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Column(name = "contract_number", nullable = false, length = 40)
  private String contractNumber;

  @Enumerated(EnumType.STRING)
  @Column(name = "origin_type", nullable = false, length = 20)
  @Builder.Default
  private OriginType originType = OriginType.DEAL;

  @Column(name = "origin_id", columnDefinition = "uuid")
  private UUID originId;

  @Column(name = "deal_id", columnDefinition = "uuid")
  private UUID dealId;

  @Column(name = "term_sheet_id", columnDefinition = "uuid")
  private UUID termSheetId;

  @Column(name = "buyer_id", nullable = false, columnDefinition = "uuid")
  private UUID buyerId;

  @Column(name = "buyer_name", nullable = false, length = 255)
  private String buyerName;

  @Column(name = "seller_id", nullable = false, columnDefinition = "uuid")
  private UUID sellerId;

  @Column(name = "seller_name", nullable = false, length = 255)
  private String sellerName;

  @Column(length = 255)
  private String commodity;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal quantity;

  @Column(length = 20)
  private String unit;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal price;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(name = "total_value", nullable = false, precision = 19, scale = 4)
  private BigDecimal totalValue;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 11)
  private Incoterm incoterm;

  @Column(name = "named_place", length = 255)
  private String namedPlace;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_method", nullable = false, length = 20)
  @Builder.Default
  private PaymentMethod paymentMethod = PaymentMethod.TT;

  @Column(name = "delivery_date")
  private LocalDate deliveryDate;

  @Column(name = "port_of_loading", length = 255)
  private String portOfLoading;

  @Column(name = "port_of_discharge", length = 255)
  private String portOfDischarge;

  @Column(name = "governing_law", length = 255)
  private String governingLaw;

  @Column(name = "dispute_resolution", length = 255)
  private String disputeResolution;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String clauses = "[]";

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private ContractStatus status = ContractStatus.DRAFT;

  @Column(name = "envelope_id", length = 255)
  private String envelopeId;

  @Column(name = "esign_provider", length = 40)
  private String esignProvider;

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

  @Column(name = "executed_at")
  private LocalDateTime executedAt;

  public enum OriginType { DEAL, TERM_SHEET, ORDER, MANUAL }

  /** Incoterms 2020 rules (ICC pub. 723). */
  public enum Incoterm { EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF }

  public enum PaymentMethod { LC, BG, TT, OA, BNPL, ESCROW }

  /** DRAFT → ISSUED → OUT_FOR_SIGNATURE → SIGNED → EXECUTED; terminal: EXECUTED, VOID, TERMINATED. */
  public enum ContractStatus { DRAFT, ISSUED, OUT_FOR_SIGNATURE, SIGNED, EXECUTED, VOID, TERMINATED }
}
