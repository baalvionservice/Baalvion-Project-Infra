package com.baalvion.tradefinance.dto;

import com.baalvion.tradefinance.domain.LetterOfCredit;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LcResponse {
  private UUID id;
  private UUID tenantId;
  private String lcNumber;
  private String lcType;
  private String status;
  private UUID applicantId;
  private String applicantName;
  private UUID beneficiaryId;
  private String beneficiaryName;
  private String issuingBank;
  private String advisingBank;
  private String confirmingBank;
  private BigDecimal amount;
  private BigDecimal availableAmount;
  private BigDecimal settledAmount;
  private String currency;
  private BigDecimal tolerancePct;
  private String incoterm;
  private String goodsDescription;
  private String portOfLoading;
  private String portOfDischarge;
  private boolean partialShipmentAllowed;
  private boolean transhipmentAllowed;
  private LocalDate latestShipmentDate;
  private LocalDate expiryDate;
  private String expiryPlace;
  private String requiredDocuments;
  private BigDecimal commissionAmount;
  private BigDecimal marginRate;
  private BigDecimal marginAmount;
  private String schemeRef;
  private String createdBy;
  private String metadata;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime issuedAt;
  private LocalDateTime settledAt;

  public static LcResponse from(LetterOfCredit lc) {
    return LcResponse.builder()
      .id(lc.getId())
      .tenantId(lc.getTenantId())
      .lcNumber(lc.getLcNumber())
      .lcType(lc.getLcType() != null ? lc.getLcType().name() : null)
      .status(lc.getStatus() != null ? lc.getStatus().name() : null)
      .applicantId(lc.getApplicantId())
      .applicantName(lc.getApplicantName())
      .beneficiaryId(lc.getBeneficiaryId())
      .beneficiaryName(lc.getBeneficiaryName())
      .issuingBank(lc.getIssuingBank())
      .advisingBank(lc.getAdvisingBank())
      .confirmingBank(lc.getConfirmingBank())
      .amount(lc.getAmount())
      .availableAmount(lc.getAvailableAmount())
      .settledAmount(lc.getSettledAmount())
      .currency(lc.getCurrency())
      .tolerancePct(lc.getTolerancePct())
      .incoterm(lc.getIncoterm())
      .goodsDescription(lc.getGoodsDescription())
      .portOfLoading(lc.getPortOfLoading())
      .portOfDischarge(lc.getPortOfDischarge())
      .partialShipmentAllowed(lc.isPartialShipmentAllowed())
      .transhipmentAllowed(lc.isTranshipmentAllowed())
      .latestShipmentDate(lc.getLatestShipmentDate())
      .expiryDate(lc.getExpiryDate())
      .expiryPlace(lc.getExpiryPlace())
      .requiredDocuments(lc.getRequiredDocuments())
      .commissionAmount(lc.getCommissionAmount())
      .marginRate(lc.getMarginRate())
      .marginAmount(lc.getMarginAmount())
      .schemeRef(lc.getSchemeRef())
      .createdBy(lc.getCreatedBy())
      .metadata(lc.getMetadata())
      .createdAt(lc.getCreatedAt())
      .updatedAt(lc.getUpdatedAt())
      .issuedAt(lc.getIssuedAt())
      .settledAt(lc.getSettledAt())
      .build();
  }
}
