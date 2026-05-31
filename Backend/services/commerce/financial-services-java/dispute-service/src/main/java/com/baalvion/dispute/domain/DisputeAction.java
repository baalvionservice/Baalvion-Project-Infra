package com.baalvion.dispute.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** An entry in a dispute's timeline across the resolution tiers (audit trail). */
@Entity
@Table(name = "dispute_actions", schema = "dispute")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeAction {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "dispute_id", nullable = false, columnDefinition = "uuid")
  private UUID disputeId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(length = 12)
  private String tier;

  @Column(length = 40)
  private String actor;

  @Column(nullable = false, length = 40)
  private String action;

  @Column(columnDefinition = "TEXT")
  private String note;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
