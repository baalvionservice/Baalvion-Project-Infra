package com.baalvion.payment.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OutboxEvent: transactional outbox row (design §9.3).
 *
 * Domain methods insert the event in the SAME transaction as the business change, so an
 * event is published if-and-only-if its transaction commits. A scheduled publisher drains
 * PENDING rows to Kafka and marks them SENT.
 */
@Entity
@Table(
  name = "outbox_events",
  schema = "payments",
  indexes = {
    @Index(name = "idx_outbox_status_created", columnList = "status,created_at")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @Column(length = 128, nullable = false)
  private String topic;

  @Column(length = 128)
  private String eventKey;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String payload;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OutboxStatus status;

  @Column(nullable = false)
  private int attempts;

  @Column(columnDefinition = "TEXT")
  private String lastError;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column
  private LocalDateTime sentAt;

  public enum OutboxStatus {
    PENDING,
    SENT,
    FAILED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (status == null) {
      status = OutboxStatus.PENDING;
    }
    if (payload == null) {
      payload = "{}";
    }
  }
}
