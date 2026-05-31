package com.baalvion.trustscore.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * The current composite trust score for a subject. Exactly one row per
 * (tenant, subject, subject_type); recomputing updates it in place (bumping {@code revision}) and
 * appends a {@link TrustScoreHistory} row.
 */
@Entity
@Table(name = "trust_scores", schema = "trust_score")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrustScore {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "subject_id", nullable = false, columnDefinition = "uuid")
  private UUID subjectId;

  @Column(name = "subject_type", nullable = false, length = 32)
  private String subjectType;

  @Column(name = "subject_name", length = 255)
  private String subjectName;

  @Column(nullable = false)
  private int score;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  private Band band;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String factors = "[]";

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String signals = "{}";

  @Column(nullable = false)
  @Builder.Default
  private int revision = 1;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  /** Score bands over the 0-1000 range. */
  public enum Band { VERY_LOW, LOW, MEDIUM, HIGH, EXCELLENT }
}
