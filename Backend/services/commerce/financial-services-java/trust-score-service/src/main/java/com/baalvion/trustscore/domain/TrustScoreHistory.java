package com.baalvion.trustscore.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** Append-only record of one trust-score recompute, with the delta versus the prior score. */
@Entity
@Table(name = "trust_score_history", schema = "trust_score")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrustScoreHistory {

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

  @Column(nullable = false)
  private int score;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  private TrustScore.Band band;

  @Column(nullable = false)
  private int delta;

  @Column(length = 255)
  private String reason;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String factors = "[]";

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
