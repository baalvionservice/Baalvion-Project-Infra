package com.baalvion.invoice.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ProcessedEvent: inbox de-duplication marker.
 *
 * Records the id of each invoice-affecting event the service has already applied, so a
 * Kafka redelivery never re-applies a payment or transition. Written in the same
 * transaction as the state change.
 */
@Entity
@Table(name = "processed_events", schema = "invoice")
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
