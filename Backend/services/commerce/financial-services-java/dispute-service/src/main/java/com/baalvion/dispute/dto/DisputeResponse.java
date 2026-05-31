package com.baalvion.dispute.dto;

import com.baalvion.dispute.domain.Dispute;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DisputeResponse {
  private UUID id;
  private UUID tenantId;
  private String reference;
  private String subjectType;
  private UUID subjectId;
  private String raisedBy;
  private String claimantName;
  private String respondentName;
  private String type;
  private BigDecimal amount;
  private String currency;
  private String description;
  private String evidence;
  private String tier;
  private String status;
  private String aiRecommendation;
  private UUID mediatorId;
  private UUID arbitratorId;
  private String proposedInFavorOf;
  private BigDecimal proposedAmount;
  private String proposedTerms;
  private String resolutionType;
  private String resolvedInFavorOf;
  private BigDecimal awardAmount;
  private String resolutionNote;
  private LocalDateTime deadlineAt;
  private LocalDateTime openedAt;
  private LocalDateTime resolvedAt;
  private List<ActionResponse> timeline;

  public static DisputeResponse from(Dispute d) {
    return from(d, null);
  }

  public static DisputeResponse from(Dispute d, List<ActionResponse> timeline) {
    return DisputeResponse.builder()
      .id(d.getId()).tenantId(d.getTenantId()).reference(d.getReference())
      .subjectType(d.getSubjectType() != null ? d.getSubjectType().name() : null).subjectId(d.getSubjectId())
      .raisedBy(d.getRaisedBy() != null ? d.getRaisedBy().name() : null)
      .claimantName(d.getClaimantName()).respondentName(d.getRespondentName())
      .type(d.getType() != null ? d.getType().name() : null).amount(d.getAmount()).currency(d.getCurrency())
      .description(d.getDescription()).evidence(d.getEvidence())
      .tier(d.getTier() != null ? d.getTier().name() : null)
      .status(d.getStatus() != null ? d.getStatus().name() : null)
      .aiRecommendation(d.getAiRecommendation())
      .mediatorId(d.getMediatorId()).arbitratorId(d.getArbitratorId())
      .proposedInFavorOf(d.getProposedInFavorOf() != null ? d.getProposedInFavorOf().name() : null)
      .proposedAmount(d.getProposedAmount()).proposedTerms(d.getProposedTerms())
      .resolutionType(d.getResolutionType() != null ? d.getResolutionType().name() : null)
      .resolvedInFavorOf(d.getResolvedInFavorOf() != null ? d.getResolvedInFavorOf().name() : null)
      .awardAmount(d.getAwardAmount()).resolutionNote(d.getResolutionNote())
      .deadlineAt(d.getDeadlineAt()).openedAt(d.getOpenedAt()).resolvedAt(d.getResolvedAt())
      .timeline(timeline)
      .build();
  }
}
