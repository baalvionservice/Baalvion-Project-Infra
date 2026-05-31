package com.baalvion.dealroom.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * The agreed commercial terms, generated when a counter-offer is accepted. EXECUTED once both the
 * buyer and the seller sign; execution emits {@code dealroom.termsheet.executed} downstream.
 */
@Entity
@Table(name = "term_sheets", schema = "deal_room")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TermSheet {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "deal_id", nullable = false, columnDefinition = "uuid")
  private UUID dealId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(nullable = false)
  @Builder.Default
  private int version = 1;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal price;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal quantity;

  @Column(length = 20)
  private String unit;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(name = "total_value", nullable = false, precision = 19, scale = 4)
  private BigDecimal totalValue;

  @Column(length = 11)
  private String incoterm;

  @Column(name = "payment_terms", columnDefinition = "TEXT")
  private String paymentTerms;

  @Column(name = "delivery_terms", columnDefinition = "TEXT")
  private String deliveryTerms;

  @Column(name = "delivery_date")
  private LocalDate deliveryDate;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String terms = "{}";

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private TermSheetStatus status = TermSheetStatus.AWAITING_SIGNATURES;

  @Column(name = "buyer_signed_at")
  private LocalDateTime buyerSignedAt;

  @Column(name = "buyer_signed_by", length = 255)
  private String buyerSignedBy;

  @Column(name = "seller_signed_at")
  private LocalDateTime sellerSignedAt;

  @Column(name = "seller_signed_by", length = 255)
  private String sellerSignedBy;

  @Column(name = "executed_at")
  private LocalDateTime executedAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public enum TermSheetStatus { DRAFT, AWAITING_SIGNATURES, EXECUTED, VOID }
}
