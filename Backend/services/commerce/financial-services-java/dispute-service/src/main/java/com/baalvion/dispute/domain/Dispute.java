package com.baalvion.dispute.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A trade dispute progressing through three tiers: AI_TRIAGE → MEDIATION → ARBITRATION. Resolution
 * (settlement, award, dismissal, withdrawal) is terminal and posts an outbox event so escrow/order
 * services can act (e.g. release or claw back funds).
 */
@Entity
@Table(name = "disputes", schema = "dispute")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Column(nullable = false, length = 40)
  private String reference;

  @Enumerated(EnumType.STRING)
  @Column(name = "subject_type", nullable = false, length = 20)
  private SubjectType subjectType;

  @Column(name = "subject_id", columnDefinition = "uuid")
  private UUID subjectId;

  @Enumerated(EnumType.STRING)
  @Column(name = "raised_by", nullable = false, length = 10)
  private Party raisedBy;

  @Column(name = "claimant_id", columnDefinition = "uuid")
  private UUID claimantId;
  @Column(name = "claimant_name", length = 255)
  private String claimantName;
  @Column(name = "respondent_id", columnDefinition = "uuid")
  private UUID respondentId;
  @Column(name = "respondent_name", length = 255)
  private String respondentName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private DisputeType type;

  @Column(precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(length = 3)
  private String currency;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String description;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String evidence = "[]";

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  @Builder.Default
  private Tier tier = Tier.AI_TRIAGE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  @Builder.Default
  private DisputeStatus status = DisputeStatus.OPEN;

  @Column(name = "ai_recommendation", columnDefinition = "jsonb")
  private String aiRecommendation;

  @Column(name = "mediator_id", columnDefinition = "uuid")
  private UUID mediatorId;
  @Column(name = "arbitrator_id", columnDefinition = "uuid")
  private UUID arbitratorId;

  @Enumerated(EnumType.STRING)
  @Column(name = "proposed_in_favor_of", length = 10)
  private Favor proposedInFavorOf;
  @Column(name = "proposed_amount", precision = 19, scale = 4)
  private BigDecimal proposedAmount;
  @Column(name = "proposed_terms", columnDefinition = "TEXT")
  private String proposedTerms;

  @Enumerated(EnumType.STRING)
  @Column(name = "resolution_type", length = 12)
  private ResolutionType resolutionType;
  @Enumerated(EnumType.STRING)
  @Column(name = "resolved_in_favor_of", length = 10)
  private Favor resolvedInFavorOf;
  @Column(name = "award_amount", precision = 19, scale = 4)
  private BigDecimal awardAmount;
  @Column(name = "resolution_note", columnDefinition = "TEXT")
  private String resolutionNote;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String metadata = "{}";

  @Column(name = "deadline_at")
  private LocalDateTime deadlineAt;

  @Column(name = "opened_at", nullable = false)
  @Builder.Default
  private LocalDateTime openedAt = LocalDateTime.now();

  @Column(name = "resolved_at")
  private LocalDateTime resolvedAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public enum SubjectType { ORDER, DEAL, CONTRACT, SHIPMENT }

  public enum Party { BUYER, SELLER }

  public enum DisputeType { QUALITY, NON_DELIVERY, PAYMENT, DOCUMENTATION, QUANTITY, OTHER }

  public enum Tier { AI_TRIAGE, MEDIATION, ARBITRATION }

  public enum DisputeStatus { OPEN, AI_REVIEW, AWAITING_RESPONSE, IN_MEDIATION, IN_ARBITRATION, RESOLVED, REJECTED, WITHDRAWN }

  public enum ResolutionType { SETTLED, AWARD, DISMISSED, WITHDRAWN }

  public enum Favor { BUYER, SELLER, SPLIT }
}
