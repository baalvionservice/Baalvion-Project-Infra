package com.baalvion.fx.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A forward contract: a rate locked today to exchange {@link #notionalAmount} of the sell currency
 * on a future {@link #valueDate}. The forward rate is the spot adjusted by forward points derived
 * from the interest-rate differential (covered interest parity).
 */
@Entity
@Table(name = "fx_forwards", schema = "fx")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxForward {

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

  @Column(name = "notional_amount", nullable = false, precision = 19, scale = 4)
  private BigDecimal notionalAmount;

  @Column(name = "spot_rate_at_book", nullable = false, precision = 19, scale = 8)
  private BigDecimal spotRateAtBook;

  @Column(name = "forward_rate", nullable = false, precision = 19, scale = 8)
  private BigDecimal forwardRate;

  @Column(name = "forward_points", nullable = false, precision = 19, scale = 8)
  @Builder.Default
  private BigDecimal forwardPoints = BigDecimal.ZERO;

  @Column(name = "buy_amount", nullable = false, precision = 19, scale = 4)
  private BigDecimal buyAmount;

  @Column(name = "value_date", nullable = false)
  private LocalDate valueDate;

  @Column(name = "tenor_days", nullable = false)
  private int tenorDays;

  @Column(name = "margin_rate", nullable = false, precision = 9, scale = 6)
  @Builder.Default
  private BigDecimal marginRate = BigDecimal.ZERO;

  @Column(name = "margin_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal marginAmount = BigDecimal.ZERO;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private ForwardStatus status = ForwardStatus.BOOKED;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "settled_at")
  private LocalDateTime settledAt;

  public enum ForwardStatus { BOOKED, SETTLED, CANCELLED }
}
