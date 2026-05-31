package com.baalvion.tradefinance.dto;

import com.baalvion.tradefinance.domain.GuaranteeClaim;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class GuaranteeClaimResponse {
  private UUID id;
  private UUID guaranteeId;
  private int claimNumber;
  private String status;
  private BigDecimal claimAmount;
  private String statement;
  private String supportingDocuments;
  private String decisionReason;
  private String decidedBy;
  private String createdBy;
  private LocalDateTime createdAt;
  private LocalDateTime decidedAt;
  private LocalDateTime paidAt;

  public static GuaranteeClaimResponse from(GuaranteeClaim c) {
    return GuaranteeClaimResponse.builder()
      .id(c.getId())
      .guaranteeId(c.getGuaranteeId())
      .claimNumber(c.getClaimNumber())
      .status(c.getStatus() != null ? c.getStatus().name() : null)
      .claimAmount(c.getClaimAmount())
      .statement(c.getStatement())
      .supportingDocuments(c.getSupportingDocuments())
      .decisionReason(c.getDecisionReason())
      .decidedBy(c.getDecidedBy())
      .createdBy(c.getCreatedBy())
      .createdAt(c.getCreatedAt())
      .decidedAt(c.getDecidedAt())
      .paidAt(c.getPaidAt())
      .build();
  }
}
