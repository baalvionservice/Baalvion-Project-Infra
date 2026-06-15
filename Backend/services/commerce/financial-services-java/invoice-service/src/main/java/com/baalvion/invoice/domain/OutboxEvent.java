package com.baalvion.invoice.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OutboxEvent: transactional-outbox row for invoice domain events.
 *
 * Written in the SAME transaction as the invoice mutation it describes, so the event commits
 * atomically with the state change. A separate relay ({@link com.baalvion.invoice.service.OutboxRelay})
 * drains PENDING rows to Kafka with retry + backoff + dead-letter — eliminating the silent
 * event loss that the previous fire-and-forget {@code kafkaTemplate.send} (swallowed exceptions,
 * no retry, no record) allowed when the broker was unreachable or the process crashed mid-send.
 *
 * Mirrors ledger-service's LedgerOutbox (the suite's canonical safe-relay design).
 */
@Entity
@Table(
  name = "outbox_events",
  schema = "invoice",
  indexes = {
    @Index(name = "idx_invoice_outbox_claim", columnList = "status,available_at")
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

  @Column(name = "tenant_id", columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @Column(length = 128, nullable = false)
  private String topic;

  /** Kafka partition key (the invoice id). */
  @Column(name = "msg_key", length = 128)
  private String msgKey;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String payload;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OutboxStatus status;

  @Column(nullable = false)
  private int attempts;

  @Column(name = "last_error", columnDefinition = "TEXT")
  private String lastError;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  /** Earliest time the relay may claim this row; advanced on each failed send (backoff). */
  @Column(name = "available_at", nullable = false)
  private LocalDateTime availableAt;

  @Column(name = "sent_at")
  private LocalDateTime sentAt;

  public enum OutboxStatus { PENDING, SENT, FAILED }

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
    if (availableAt == null) {
      availableAt = LocalDateTime.now();
    }
  }
}
