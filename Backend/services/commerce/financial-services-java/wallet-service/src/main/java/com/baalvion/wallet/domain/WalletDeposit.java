package com.baalvion.wallet.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A user-initiated top-up of their wallet balance, paid via payment-service's crypto gateway.
 * The balance itself is only ever mutated by the idempotent /billing/fulfill callback once the
 * charge is confirmed CAPTURED on-chain — this row just tracks the attempt for polling/support.
 */
@Entity
@Table(name = "wallet_deposits", schema = "wallet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletDeposit {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "wallet_id", nullable = false, columnDefinition = "uuid")
  private UUID walletId;

  @Column(name = "holder_id", nullable = false, columnDefinition = "uuid")
  private UUID holderId;

  @Column(nullable = false, length = 3)
  @Builder.Default
  private String currency = "USD";

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(nullable = false, length = 20)
  private String asset;

  @Column(name = "provider_charge_id", columnDefinition = "uuid")
  private UUID providerChargeId;

  @Column(nullable = false, length = 20)
  @Builder.Default
  private String status = "pending";

  @Column(name = "fulfillment_error", columnDefinition = "text")
  private String fulfillmentError;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "credited_at")
  private LocalDateTime creditedAt;
}
