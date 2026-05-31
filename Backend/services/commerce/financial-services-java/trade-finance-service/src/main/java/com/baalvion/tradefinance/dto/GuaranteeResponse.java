package com.baalvion.tradefinance.dto;

import com.baalvion.tradefinance.domain.BankGuarantee;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class GuaranteeResponse {
  private UUID id;
  private UUID tenantId;
  private String guaranteeNumber;
  private String guaranteeType;
  private String status;
  private UUID applicantId;
  private String applicantName;
  private UUID beneficiaryId;
  private String beneficiaryName;
  private String guarantorBank;
  private BigDecimal amount;
  private BigDecimal claimedAmount;
  private String currency;
  private String underlyingContractRef;
  private String purpose;
  private String governingRules;
  private LocalDate effectiveDate;
  private LocalDate expiryDate;
  private boolean autoExtend;
  private BigDecimal commissionAmount;
  private BigDecimal marginRate;
  private BigDecimal marginAmount;
  private String schemeRef;
  private String createdBy;
  private String metadata;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime issuedAt;

  public static GuaranteeResponse from(BankGuarantee g) {
    return GuaranteeResponse.builder()
      .id(g.getId())
      .tenantId(g.getTenantId())
      .guaranteeNumber(g.getGuaranteeNumber())
      .guaranteeType(g.getGuaranteeType() != null ? g.getGuaranteeType().name() : null)
      .status(g.getStatus() != null ? g.getStatus().name() : null)
      .applicantId(g.getApplicantId())
      .applicantName(g.getApplicantName())
      .beneficiaryId(g.getBeneficiaryId())
      .beneficiaryName(g.getBeneficiaryName())
      .guarantorBank(g.getGuarantorBank())
      .amount(g.getAmount())
      .claimedAmount(g.getClaimedAmount())
      .currency(g.getCurrency())
      .underlyingContractRef(g.getUnderlyingContractRef())
      .purpose(g.getPurpose())
      .governingRules(g.getGoverningRules() != null ? g.getGoverningRules().name() : null)
      .effectiveDate(g.getEffectiveDate())
      .expiryDate(g.getExpiryDate())
      .autoExtend(g.isAutoExtend())
      .commissionAmount(g.getCommissionAmount())
      .marginRate(g.getMarginRate())
      .marginAmount(g.getMarginAmount())
      .schemeRef(g.getSchemeRef())
      .createdBy(g.getCreatedBy())
      .metadata(g.getMetadata())
      .createdAt(g.getCreatedAt())
      .updatedAt(g.getUpdatedAt())
      .issuedAt(g.getIssuedAt())
      .build();
  }
}
