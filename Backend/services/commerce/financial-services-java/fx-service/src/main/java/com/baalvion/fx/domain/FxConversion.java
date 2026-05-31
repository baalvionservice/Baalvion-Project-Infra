package com.baalvion.fx.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** An executed FX conversion: spot, or the execution of a rate-lock or forward. */
@Entity
@Table(name = "fx_conversions", schema = "fx")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxConversion {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Column(name = "sell_currency", nullable = false, length = 3)
  private String sellCurrency;

  @Column(name = "buy_currency", nullable = false, length = 3)
  private String buyCurrency;

  @Column(name = "sell_amount", nullable = false, precision = 19, scale = 4)
  private BigDecimal sellAmount;

  @Column(name = "buy_amount", nullable = false, precision = 19, scale = 4)
  private BigDecimal buyAmount;

  @Column(nullable = false, precision = 19, scale = 8)
  private BigDecimal rate;

  @Enumerated(EnumType.STRING)
  @Column(name = "deal_type", nullable = false, length = 20)
  @Builder.Default
  private DealType dealType = DealType.SPOT;

  @Column(name = "rate_lock_id", columnDefinition = "uuid")
  private UUID rateLockId;

  @Column(name = "forward_id", columnDefinition = "uuid")
  private UUID forwardId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private ConversionStatus status = ConversionStatus.EXECUTED;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public enum DealType { SPOT, RATE_LOCK, FORWARD }

  public enum ConversionStatus { EXECUTED, SETTLED }
}
