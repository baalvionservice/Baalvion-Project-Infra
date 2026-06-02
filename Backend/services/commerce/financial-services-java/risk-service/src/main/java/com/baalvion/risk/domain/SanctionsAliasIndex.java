package com.baalvion.risk.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Flat alias lookup index: one row per (entity, normalized alias / primary name) for fast exact-alias
 * lookup and audit. Populated at ingest. The fuzzy matcher screens the in-memory entity snapshot; this
 * table backs exact lookups and future pg_trgm candidate prefiltering. Global reference data.
 */
@Entity
@Table(
  name = "sanctions_alias_index",
  schema = "risk",
  indexes = {
    @Index(name = "idx_alias_index_norm", columnList = "alias_normalized"),
    @Index(name = "idx_alias_index_entity", columnList = "entity_id")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanctionsAliasIndex {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "entity_id", columnDefinition = "uuid", nullable = false)
  private UUID entityId;

  @Column(name = "list_source", length = 32, nullable = false)
  private String listSource;

  @Column(name = "alias_normalized", length = 512, nullable = false)
  private String aliasNormalized;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }
}
