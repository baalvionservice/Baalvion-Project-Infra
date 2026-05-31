package com.baalvion.dealroom.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A bilateral negotiation room between a buyer and a seller. Opens from a listing/RFQ, accrues
 * counter-offer rounds, and reaches AGREED when one side accepts the live offer — which generates
 * a term sheet for both parties to sign.
 */
@Entity
@Table(name = "deal_rooms", schema = "deal_room")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealRoom {

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

  @Enumerated(EnumType.STRING)
  @Column(name = "origin_type", nullable = false, length = 20)
  @Builder.Default
  private OriginType originType = OriginType.LISTING;

  @Column(name = "origin_id", columnDefinition = "uuid")
  private UUID originId;

  @Column(nullable = false, length = 255)
  private String title;

  @Column(length = 255)
  private String commodity;

  @Column(name = "buyer_id", nullable = false, columnDefinition = "uuid")
  private UUID buyerId;

  @Column(name = "buyer_name", length = 255)
  private String buyerName;

  @Column(name = "seller_id", nullable = false, columnDefinition = "uuid")
  private UUID sellerId;

  @Column(name = "seller_name", length = 255)
  private String sellerName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private DealStatus status = DealStatus.OPEN;

  @Column(name = "current_price", precision = 19, scale = 4)
  private BigDecimal currentPrice;

  @Column(name = "current_quantity", precision = 19, scale = 4)
  private BigDecimal currentQuantity;

  @Column(length = 20)
  private String unit;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(length = 11)
  private String incoterm;

  @Enumerated(EnumType.STRING)
  @Column(name = "current_offer_by", length = 10)
  private Party currentOfferBy;

  @Column(name = "round_count", nullable = false)
  @Builder.Default
  private int roundCount = 0;

  @Column(name = "term_sheet_id", columnDefinition = "uuid")
  private UUID termSheetId;

  @Column(name = "agreed_at")
  private LocalDateTime agreedAt;

  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;

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

  public enum OriginType { LISTING, RFQ, DIRECT }

  public enum Party { BUYER, SELLER }

  /** OPEN → NEGOTIATING → AGREED; terminal: AGREED(+term sheet), REJECTED, EXPIRED, CANCELLED. */
  public enum DealStatus { OPEN, NEGOTIATING, AGREED, REJECTED, EXPIRED, CANCELLED }
}
