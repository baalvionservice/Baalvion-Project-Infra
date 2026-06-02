package com.baalvion.risk.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * The result of screening a subject (a name + optional type/country) against the consolidated
 * watchlist (gap G3). Tenant-scoped (RLS). {@code hits} is a JSON array of the top matches above the
 * configured match threshold; {@code status} is the screening verdict, which may be overridden by a
 * compliance officer via adjudication.
 */
@Entity
@Table(
  name = "sanctions_screenings",
  schema = "risk",
  indexes = {
    @Index(name = "idx_screening_tenant_status", columnList = "tenant_id,status,created_at DESC"),
    @Index(name = "idx_screening_tenant_ref", columnList = "tenant_id,reference_type,reference_id")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanctionsScreening {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(name = "tenant_id", columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @Column(name = "subject_name", length = 512, nullable = false)
  private String subjectName;

  @Column(name = "normalized_subject", length = 512, nullable = false)
  private String normalizedSubject;

  @Enumerated(EnumType.STRING)
  @Column(name = "subject_type", length = 32, nullable = false)
  private SanctionedEntity.EntityType subjectType;

  @Column(name = "subject_country", length = 64)
  private String subjectCountry;

  @Column(name = "reference_type", length = 64)
  private String referenceType;

  @Column(name = "reference_id", length = 128)
  private String referenceId;

  @Enumerated(EnumType.STRING)
  @Column(length = 24, nullable = false)
  private Status status;

  @Column(name = "top_score", precision = 5, scale = 4, nullable = false)
  private BigDecimal topScore;

  /** JSON array of hit objects (entityId, listSource, matchedName, score, entityType, programs). */
  @Column(columnDefinition = "jsonb", nullable = false)
  private String hits;

  @Column(name = "hit_count", nullable = false)
  private int hitCount;

  @Column(name = "adjudicated_by", length = 128)
  private String adjudicatedBy;

  @Column(name = "adjudication_note", columnDefinition = "TEXT")
  private String adjudicationNote;

  @Column(name = "adjudicated_at")
  private LocalDateTime adjudicatedAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  public enum Status {
    /** No match at or above the match threshold — safe to proceed. */
    CLEAR,
    /** One or more matches at/above the match threshold — needs review. */
    POTENTIAL_MATCH,
    /** A match at/above the auto-block threshold — transaction must be blocked. */
    CONFIRMED_MATCH,
    /** A compliance officer reviewed potential matches and cleared them. */
    FALSE_POSITIVE,
    /** A compliance officer confirmed a true hit — permanently blocked. */
    BLOCKED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (hits == null) hits = "[]";
    if (topScore == null) topScore = BigDecimal.ZERO;
  }
}
