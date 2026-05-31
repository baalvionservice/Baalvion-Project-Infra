package com.baalvion.tradefinance.dto;

import com.baalvion.tradefinance.domain.LcAmendment;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LcAmendmentResponse {
  private UUID id;
  private UUID lcId;
  private int amendmentNumber;
  private String status;
  private BigDecimal newAmount;
  private LocalDate newExpiryDate;
  private String changes;
  private String reason;
  private boolean requiresConsent;
  private String consentedBy;
  private String createdBy;
  private LocalDateTime createdAt;
  private LocalDateTime decidedAt;

  public static LcAmendmentResponse from(LcAmendment a) {
    return LcAmendmentResponse.builder()
      .id(a.getId())
      .lcId(a.getLcId())
      .amendmentNumber(a.getAmendmentNumber())
      .status(a.getStatus() != null ? a.getStatus().name() : null)
      .newAmount(a.getNewAmount())
      .newExpiryDate(a.getNewExpiryDate())
      .changes(a.getChanges())
      .reason(a.getReason())
      .requiresConsent(a.isRequiresConsent())
      .consentedBy(a.getConsentedBy())
      .createdBy(a.getCreatedBy())
      .createdAt(a.getCreatedAt())
      .decidedAt(a.getDecidedAt())
      .build();
  }
}
