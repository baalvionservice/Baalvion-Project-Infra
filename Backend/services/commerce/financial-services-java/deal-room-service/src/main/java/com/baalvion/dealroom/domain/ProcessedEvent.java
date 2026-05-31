package com.baalvion.dealroom.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** Inbox for exactly-once consumption: the unique PK makes reprocessing a no-op. */
@Entity
@Table(name = "processed_events", schema = "deal_room")
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
