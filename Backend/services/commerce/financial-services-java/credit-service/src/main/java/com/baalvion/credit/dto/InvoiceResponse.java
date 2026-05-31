package com.baalvion.credit.dto;

import com.baalvion.credit.domain.FinancedInvoice;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InvoiceResponse {
  private UUID id;
  private UUID tenantId;
  private String reference;
  private String invoiceNumber;
  private String status;
  private UUID sellerId;
  private String sellerName;
  private UUID debtorId;
  private String debtorName;
  private BigDecimal faceAmount;
  private String currency;
  private LocalDate issueDate;
  private LocalDate dueDate;
  private BigDecimal advanceRate;
  private BigDecimal advanceAmount;
  private BigDecimal feeRate;
  private BigDecimal feeAmount;
  private BigDecimal reserveAmount;
  private BigDecimal collectedAmount;
  private String riskGrade;
  private Integer riskScore;
  private String riskRationale;
  private String createdBy;
  private String metadata;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime fundedAt;
  private LocalDateTime collectedAt;

  public static InvoiceResponse from(FinancedInvoice i) {
    return InvoiceResponse.builder()
      .id(i.getId())
      .tenantId(i.getTenantId())
      .reference(i.getReference())
      .invoiceNumber(i.getInvoiceNumber())
      .status(i.getStatus() != null ? i.getStatus().name() : null)
      .sellerId(i.getSellerId())
      .sellerName(i.getSellerName())
      .debtorId(i.getDebtorId())
      .debtorName(i.getDebtorName())
      .faceAmount(i.getFaceAmount())
      .currency(i.getCurrency())
      .issueDate(i.getIssueDate())
      .dueDate(i.getDueDate())
      .advanceRate(i.getAdvanceRate())
      .advanceAmount(i.getAdvanceAmount())
      .feeRate(i.getFeeRate())
      .feeAmount(i.getFeeAmount())
      .reserveAmount(i.getReserveAmount())
      .collectedAmount(i.getCollectedAmount())
      .riskGrade(i.getRiskGrade())
      .riskScore(i.getRiskScore())
      .riskRationale(i.getRiskRationale())
      .createdBy(i.getCreatedBy())
      .metadata(i.getMetadata())
      .createdAt(i.getCreatedAt())
      .updatedAt(i.getUpdatedAt())
      .fundedAt(i.getFundedAt())
      .collectedAt(i.getCollectedAt())
      .build();
  }
}
