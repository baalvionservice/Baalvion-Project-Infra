package com.baalvion.dealroom.domain;

import com.baalvion.dealroom.domain.DealRoom.Party;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** One negotiation round. The latest PROPOSED counter-offer is the live offer on the table. */
@Entity
@Table(name = "counter_offers", schema = "deal_room")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounterOffer {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "deal_id", nullable = false, columnDefinition = "uuid")
  private UUID dealId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(nullable = false)
  private int round;

  @Enumerated(EnumType.STRING)
  @Column(name = "offered_by", nullable = false, length = 10)
  private Party offeredBy;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal price;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal quantity;

  @Column(length = 20)
  private String unit;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(length = 11)
  private String incoterm;

  @Column(name = "delivery_terms", columnDefinition = "TEXT")
  private String deliveryTerms;

  @Column(name = "payment_terms", columnDefinition = "TEXT")
  private String paymentTerms;

  @Column(columnDefinition = "TEXT")
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  @Builder.Default
  private OfferStatus status = OfferStatus.PROPOSED;

  @Column(name = "valid_until")
  private LocalDateTime validUntil;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "decided_at")
  private LocalDateTime decidedAt;

  public enum OfferStatus { PROPOSED, ACCEPTED, REJECTED, SUPERSEDED, EXPIRED }
}
