package com.baalvion.tradefinance.dto;

import com.baalvion.tradefinance.domain.LcPresentation;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LcPresentationResponse {
  private UUID id;
  private UUID lcId;
  private int presentationNumber;
  private String status;
  private BigDecimal presentedAmount;
  private String documents;
  private String discrepancies;
  private LocalDate examinationDueDate;
  private String examinedBy;
  private boolean waived;
  private String createdBy;
  private LocalDateTime createdAt;
  private LocalDateTime examinedAt;
  private LocalDateTime settledAt;

  public static LcPresentationResponse from(LcPresentation p) {
    return LcPresentationResponse.builder()
      .id(p.getId())
      .lcId(p.getLcId())
      .presentationNumber(p.getPresentationNumber())
      .status(p.getStatus() != null ? p.getStatus().name() : null)
      .presentedAmount(p.getPresentedAmount())
      .documents(p.getDocuments())
      .discrepancies(p.getDiscrepancies())
      .examinationDueDate(p.getExaminationDueDate())
      .examinedBy(p.getExaminedBy())
      .waived(p.isWaived())
      .createdBy(p.getCreatedBy())
      .createdAt(p.getCreatedAt())
      .examinedAt(p.getExaminedAt())
      .settledAt(p.getSettledAt())
      .build();
  }
}
