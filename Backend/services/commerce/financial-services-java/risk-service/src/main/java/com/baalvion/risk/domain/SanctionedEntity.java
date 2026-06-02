package com.baalvion.risk.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A consolidated-watchlist record (gap G3). Global reference data shared across all tenants —
 * NOT tenant-scoped. Loaded/refreshed from a {@code SanctionsListProvider} (seed by default; OFAC/UN/EU
 * downloaders behind config). {@code normalizedName} is the matching key produced by {@code NameNormalizer};
 * {@code aliases}/{@code programs}/{@code countries} are JSON arrays persisted to jsonb columns.
 */
@Entity
@Table(
  name = "sanctioned_entities",
  schema = "risk",
  indexes = {
    @Index(name = "idx_sanctioned_norm_name", columnList = "normalized_name"),
    @Index(name = "idx_sanctioned_active_type", columnList = "active,entity_type")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_sanctioned_entity_src", columnNames = {"list_source", "external_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanctionedEntity {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Enumerated(EnumType.STRING)
  @Column(name = "list_source", length = 32, nullable = false)
  private ListSource listSource;

  @Column(name = "external_id", length = 128, nullable = false)
  private String externalId;

  @Enumerated(EnumType.STRING)
  @Column(name = "entity_type", length = 32, nullable = false)
  private EntityType entityType;

  @Column(name = "primary_name", length = 512, nullable = false)
  private String primaryName;

  @Column(name = "normalized_name", length = 512, nullable = false)
  private String normalizedName;

  /** Cross-source dedup key: normalize(name)|primaryIsoCountry|type. Same key across OFAC/EU/UN = same entity. */
  @Column(name = "merge_key", length = 600)
  private String mergeKey;

  /** JSON array of {name, normalized}. */
  @Column(columnDefinition = "jsonb", nullable = false)
  private String aliases;

  /** JSON array of address strings (EU/UN carry full addresses; OFAC carries city/state). */
  @Column(columnDefinition = "jsonb", nullable = false)
  private String addresses;

  /** JSON array of program codes. */
  @Column(columnDefinition = "jsonb", nullable = false)
  private String programs;

  /** JSON array of country codes/names. */
  @Column(columnDefinition = "jsonb", nullable = false)
  private String countries;

  @Column(name = "date_of_birth", length = 64)
  private String dateOfBirth;

  @Column(columnDefinition = "TEXT")
  private String remarks;

  @Column(nullable = false)
  private boolean active;

  @Column(name = "source_published_at")
  private LocalDateTime sourcePublishedAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  public enum ListSource {
    OFAC_SDN("OFAC"),
    UN_CONSOLIDATED("UN"),
    EU_CFSP("EU"),
    UK_HMT("UK"),
    AU_DFAT("AU");

    private final String code;

    ListSource(String code) {
      this.code = code;
    }

    /** Short jurisdiction code for the external API contract (OFAC | EU | UN | UK | AU). */
    public String code() {
      return code;
    }
  }

  public enum EntityType {
    INDIVIDUAL,
    ORGANIZATION,
    VESSEL,
    AIRCRAFT,
    OTHER
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (aliases == null) aliases = "[]";
    if (programs == null) programs = "[]";
    if (countries == null) countries = "[]";
    if (addresses == null) addresses = "[]";
  }
}
