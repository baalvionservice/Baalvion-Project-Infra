package com.baalvion.credit.dto;

import com.baalvion.credit.domain.BnplInstallment;
import com.baalvion.credit.domain.BnplPlan;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class BnplPlanResponse {
  private UUID id;
  private UUID tenantId;
  private String reference;
  private String orderRef;
  private String status;
  private UUID buyerId;
  private String buyerName;
  private UUID merchantId;
  private String merchantName;
  private BigDecimal principal;
  private String currency;
  private String termType;
  private int installmentCount;
  private int tenorDays;
  private BigDecimal interestRate;
  private BigDecimal interestAmount;
  private BigDecimal totalPayable;
  private BigDecimal outstanding;
  private BigDecimal lateFees;
  private String riskGrade;
  private Integer riskScore;
  private String riskRationale;
  private String createdBy;
  private String metadata;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime disbursedAt;
  private LocalDateTime settledAt;
  private List<BnplInstallmentResponse> installments;

  public static BnplPlanResponse from(BnplPlan p) {
    return from(p, null);
  }

  public static BnplPlanResponse from(BnplPlan p, List<BnplInstallment> installments) {
    return BnplPlanResponse.builder()
      .id(p.getId())
      .tenantId(p.getTenantId())
      .reference(p.getReference())
      .orderRef(p.getOrderRef())
      .status(p.getStatus() != null ? p.getStatus().name() : null)
      .buyerId(p.getBuyerId())
      .buyerName(p.getBuyerName())
      .merchantId(p.getMerchantId())
      .merchantName(p.getMerchantName())
      .principal(p.getPrincipal())
      .currency(p.getCurrency())
      .termType(p.getTermType() != null ? p.getTermType().name() : null)
      .installmentCount(p.getInstallmentCount())
      .tenorDays(p.getTenorDays())
      .interestRate(p.getInterestRate())
      .interestAmount(p.getInterestAmount())
      .totalPayable(p.getTotalPayable())
      .outstanding(p.getOutstanding())
      .lateFees(p.getLateFees())
      .riskGrade(p.getRiskGrade())
      .riskScore(p.getRiskScore())
      .riskRationale(p.getRiskRationale())
      .createdBy(p.getCreatedBy())
      .metadata(p.getMetadata())
      .createdAt(p.getCreatedAt())
      .updatedAt(p.getUpdatedAt())
      .disbursedAt(p.getDisbursedAt())
      .settledAt(p.getSettledAt())
      .installments(installments != null
        ? installments.stream().map(BnplInstallmentResponse::from).toList() : null)
      .build();
  }
}
