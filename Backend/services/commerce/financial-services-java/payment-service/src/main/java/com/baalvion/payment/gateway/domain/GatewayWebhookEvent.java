package com.baalvion.payment.gateway.domain;

import com.baalvion.payment.gateway.spi.GatewayStatus;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * GatewayWebhookEvent: the persistent dedup ledger for verified PSP webhooks.
 *
 * <p>One row per processed provider event, keyed by
 * {@code (website_slug, provider, provider_event_id)} (UNIQUE). The presence of a row means the
 * event has already been applied to its {@link GatewayPayment}, so a redelivery or replay is a
 * no-op. This survives restarts (unlike an in-memory cache) and covers replays that fall outside
 * the adapter's signature-timestamp window.
 *
 * <p>Like {@link GatewayPayment}, tenant scope is the {@code website_slug} column (enforced at the
 * query layer); the webhook path carries no tenant GUC, so this table is not under session RLS.
 */
@Entity
@Table(
  name = "gateway_webhook_events",
  schema = "payments",
  indexes = {
    @Index(name = "idx_gwwebhook_site_provider_ref", columnList = "website_slug,provider,provider_ref")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_gateway_webhook_event", columnNames = {"website_slug", "provider", "provider_event_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GatewayWebhookEvent {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "website_slug", length = 190, nullable = false)
  private String websiteSlug;

  @Column(length = 40, nullable = false)
  private String provider;

  /** Body-derived stable event id — the dedup key. Never an attacker-settable header. */
  @Column(name = "provider_event_id", length = 255, nullable = false)
  private String providerEventId;

  @Column(name = "provider_ref", length = 190)
  private String providerRef;

  @Column(name = "event_type", length = 120)
  private String eventType;

  @Enumerated(EnumType.STRING)
  @Column(length = 32)
  private GatewayStatus status;

  /** Event amount in MINOR units, validated against the charge before a money-positive transition. */
  @Column(precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(length = 3)
  private String currency;

  @Column(name = "amount_validated", nullable = false)
  private boolean amountValidated;

  @Column(nullable = false)
  private boolean applied;

  @CreationTimestamp
  @Column(name = "received_at", nullable = false, updatable = false)
  private LocalDateTime receivedAt;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (websiteSlug == null || websiteSlug.isBlank()) {
      websiteSlug = "__global__";
    }
  }
}
