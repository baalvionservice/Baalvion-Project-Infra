package com.baalvion.audit.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WebhookSubscription: a tenant's registration to receive signed event callbacks (design §7.2
 * "HMAC-SHA256 webhook signatures for outbound event delivery").
 *
 * {@code eventPattern} is a Java regex matched against the event type (e.g.
 * {@code payments\..*}); {@code secret} is the per-subscription HMAC key.
 */
@Entity
@Table(
  name = "webhook_subscriptions",
  schema = "audit",
  indexes = {
    @Index(name = "idx_wh_sub_tenant_active", columnList = "tenant_id,active")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookSubscription {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @Column(length = 512, nullable = false)
  private String url;

  /** HMAC-SHA256 signing secret. Never returned in API responses. */
  @Column(length = 128, nullable = false)
  private String secret;

  /** Regex matched against the event type; null/blank means all events. */
  @Column(length = 256)
  private String eventPattern;

  @Column(nullable = false)
  private boolean active;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }
}
