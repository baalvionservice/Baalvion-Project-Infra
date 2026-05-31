package com.baalvion.wallet.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Reserved funds within a balance, later captured (debited) or released (returned to available). */
@Entity
@Table(name = "wallet_holds", schema = "wallet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletHold {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "wallet_id", nullable = false, columnDefinition = "uuid")
  private UUID walletId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(nullable = false, length = 3)
  private String currency;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private HoldStatus status = HoldStatus.ACTIVE;

  @Column(length = 255)
  private String reference;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "expires_at")
  private LocalDateTime expiresAt;

  @Column(name = "resolved_at")
  private LocalDateTime resolvedAt;

  public enum HoldStatus { ACTIVE, RELEASED, CAPTURED, EXPIRED }
}
