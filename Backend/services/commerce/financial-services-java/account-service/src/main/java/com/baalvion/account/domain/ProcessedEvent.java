package com.baalvion.account.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ProcessedEvent: inbox de-duplication marker.
 *
 * Records the id of each balance-affecting event the service has already applied, so a
 * Kafka redelivery never double-debits or double-credits an account. Written in the same
 * transaction as the balance change.
 */
@Entity
@Table(name = "processed_events", schema = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessedEvent {

  @Id
  @Column(name = "event_id", length = 160)
  private String eventId;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime processedAt;
}
