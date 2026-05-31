package com.baalvion.tradefinance.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Inbox table for exactly-once event consumption. Before processing a consumed event we insert
 * its id here; the unique PK makes reprocessing a no-op (idempotent consumer).
 */
@Entity
@Table(name = "processed_events", schema = "trade_finance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessedEvent {

  @Id
  @Column(name = "event_id", columnDefinition = "uuid")
  private UUID eventId;

  @Column(name = "event_type", length = 128)
  private String eventType;

  @CreationTimestamp
  @Column(name = "processed_at", nullable = false, updatable = false)
  private LocalDateTime processedAt;
}
