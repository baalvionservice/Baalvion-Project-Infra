package com.baalvion.fx.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** A firm FX quote held for a validity window; can be executed into a conversion before expiry. */
@Entity
@Table(name = "fx_rate_locks", schema = "fx")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxRateLock {

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

  @Column(name = "locked_rate", nullable = false, precision = 19, scale = 8)
  private BigDecimal lockedRate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private LockStatus status = LockStatus.LOCKED;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;

  @Column(name = "executed_at")
  private LocalDateTime executedAt;

  public enum LockStatus { LOCKED, EXECUTED, EXPIRED, CANCELLED }
}
