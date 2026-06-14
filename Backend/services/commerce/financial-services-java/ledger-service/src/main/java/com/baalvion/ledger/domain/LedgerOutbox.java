package com.baalvion.ledger.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * LedgerOutbox: transactional-outbox row.
 *
 * Written in the SAME transaction as the JournalEntry it describes, so the event is committed
 * atomically with the ledger change. A separate relay ({@code LedgerOutboxRelay}) drains
 * PENDING rows to Kafka synchronously, eliminating the silent ledger/downstream divergence
 * that fire-and-forget {@code kafkaTemplate.send} allowed.
 */
@Entity
@Table(
  name = "ledger_outbox",
  schema = "ledger",
  indexes = {
    @Index(name = "idx_ledger_outbox_claim", columnList = "status,available_at")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerOutbox {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  /** The journal entry id this event describes (also the Kafka key). */
  @Column(name = "aggregate_id", columnDefinition = "uuid", nullable = false)
  private UUID aggregateId;

  @Column(name = "tenant_id", columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @Column(length = 128, nullable = false)
  private String topic;

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
