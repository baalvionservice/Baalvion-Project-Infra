package com.baalvion.fx.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** Inbox table for exactly-once event consumption. */
@Entity
@Table(name = "processed_events", schema = "fx")
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
