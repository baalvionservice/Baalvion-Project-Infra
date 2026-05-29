package com.baalvion.audit.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WebhookDelivery: one attempt-tracked delivery of an event to a subscription.
 *
 * Created PENDING when an event matches a subscription; a scheduled dispatcher signs and POSTs
 * it (HMAC-SHA256), retries with exponential backoff via {@code nextAttemptAt}, and routes to
 * FAILED (dead-letter) after {@code maxAttempts}. The delivery id is the idempotency key sent
 * to the subscriber.
 */
@Entity
@Table(
  name = "webhook_deliveries",
  schema = "audit",
  indexes = {
    @Index(name = "idx_wh_del_due", columnList = "status,next_attempt_at"),
    @Index(name = "idx_wh_del_sub", columnList = "subscription_id,created_at DESC")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookDelivery {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID subscriptionId;

  @Column(length = 512, nullable = false)
  private String url;

  @Column(length = 128, nullable = false)
  private String eventType;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String payload;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DeliveryStatus status;

  @Column(nullable = false)
  private int attempts;

  @Column
  private Integer responseStatus;

  @Column(columnDefinition = "TEXT")
  private String lastError;

  @Column
  private LocalDateTime nextAttemptAt;

  @Column
  private LocalDateTime deliveredAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  public enum DeliveryStatus {
    PENDING,
    DELIVERED,
    FAILED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (status == null) {
      status = DeliveryStatus.PENDING;
    }
    if (nextAttemptAt == null) {
      nextAttemptAt = LocalDateTime.now();
    }
  }
}
