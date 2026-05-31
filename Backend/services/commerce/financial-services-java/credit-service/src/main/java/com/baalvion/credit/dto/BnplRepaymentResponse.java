package com.baalvion.credit.dto;

import com.baalvion.credit.domain.BnplRepayment;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BnplRepaymentResponse {
  private UUID id;
  private UUID planId;
  private UUID installmentId;
  private BigDecimal amount;
  private String reference;
  private String createdBy;
  private LocalDateTime createdAt;

  public static BnplRepaymentResponse from(BnplRepayment r) {
    return BnplRepaymentResponse.builder()
      .id(r.getId())
      .planId(r.getPlanId())
      .installmentId(r.getInstallmentId())
      .amount(r.getAmount())
      .reference(r.getReference())
      .createdBy(r.getCreatedBy())
      .createdAt(r.getCreatedAt())
      .build();
  }
}
