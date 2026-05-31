package com.baalvion.fx.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** Transactional outbox row (events committed atomically with the business change). */
@Entity
@Table(
  name = "outbox_events",
  schema = "fx",
  indexes = { @Index(name = "idx_fx_outbox_status_created", columnList = "status,created_at") }
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

  @Column(name = "event_key", length = 128)
  private String eventKey;

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

  @Column(name = "sent_at")
  private LocalDateTime sentAt;

  public enum OutboxStatus { PENDING, SENT, FAILED }

  @PrePersist
  protected void onCreate() {
    if (id == null) id = UUID.randomUUID();
    if (status == null) status = OutboxStatus.PENDING;
    if (payload == null) payload = "{}";
  }
}
