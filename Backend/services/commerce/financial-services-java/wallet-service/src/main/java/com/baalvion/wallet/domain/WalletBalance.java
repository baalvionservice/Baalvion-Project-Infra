package com.baalvion.wallet.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A single-currency balance within a wallet. {@code available} is spendable; {@code held} is
 * reserved by active holds. Guarded by an optimistic {@code @Version} so concurrent movements on
 * the same balance never silently overwrite each other.
 */
@Entity
@Table(name = "wallet_balances", schema = "wallet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletBalance {

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
  @Builder.Default
  private BigDecimal available = BigDecimal.ZERO;

  @Column(nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal held = BigDecimal.ZERO;

  @Version
  @Column(nullable = false)
  private long version;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}
