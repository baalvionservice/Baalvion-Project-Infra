package com.baalvion.wallet.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Idempotent claim for payment-service's BillingFulfillmentClient webhook callback — mirrors
 * giftcard-service's gift_card_billing_webhook_events exactly. Not tenant-scoped (provider event
 * ids, e.g. a crypto tx hash, are correlated globally, not per-tenant).
 */
@Entity
@Table(name = "wallet_billing_webhook_events", schema = "wallet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletBillingWebhookEvent {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(nullable = false, length = 40)
  private String provider;

  @Column(name = "event_id", nullable = false, length = 160)
  private String eventId;

  @Column(nullable = false, length = 10)
  @Builder.Default
  private String status = "claimed";

  @Column(columnDefinition = "jsonb")
  private String payload;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
