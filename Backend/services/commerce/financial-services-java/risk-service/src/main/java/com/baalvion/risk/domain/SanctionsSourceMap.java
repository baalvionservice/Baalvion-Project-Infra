package com.baalvion.risk.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Cross-source traceability: one row per (list_source, external_id) recording which logical entity
 * (merge_key + entity_id) that source record resolved to. Lets you answer "which sources flag this
 * entity?" (the {@code sourceIds[]} of the canonical model) and audit how cross-source merging happened.
 * Global reference data — not tenant-scoped.
 */
@Entity
@Table(
  name = "sanctions_source_map",
  schema = "risk",
  indexes = { @Index(name = "idx_source_map_merge_key", columnList = "merge_key") },
  uniqueConstraints = { @UniqueConstraint(name = "uk_source_map_src", columnNames = {"list_source", "external_id"}) }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanctionsSourceMap {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "merge_key", length = 600, nullable = false)
  private String mergeKey;

  @Column(name = "list_source", length = 32, nullable = false)
  private String listSource;

  @Column(name = "external_id", length = 128, nullable = false)
  private String externalId;

  @Column(name = "entity_id", columnDefinition = "uuid", nullable = false)
  private UUID entityId;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }
}
