package com.baalvion.credit.dto;

import com.baalvion.credit.domain.BnplInstallment;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BnplInstallmentResponse {
  private UUID id;
  private UUID planId;
  private int sequenceNo;
  private LocalDate dueDate;
  private BigDecimal amount;
  private BigDecimal principalComponent;
  private BigDecimal interestComponent;
  private BigDecimal paidAmount;
  private BigDecimal lateFee;
  private String status;
  private LocalDateTime paidAt;

  public static BnplInstallmentResponse from(BnplInstallment i) {
    return BnplInstallmentResponse.builder()
      .id(i.getId())
      .planId(i.getPlanId())
      .sequenceNo(i.getSequenceNo())
      .dueDate(i.getDueDate())
      .amount(i.getAmount())
      .principalComponent(i.getPrincipalComponent())
      .interestComponent(i.getInterestComponent())
      .paidAmount(i.getPaidAmount())
      .lateFee(i.getLateFee())
      .status(i.getStatus() != null ? i.getStatus().name() : null)
      .paidAt(i.getPaidAt())
      .build();
  }
}
