package com.baalvion.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeBreakdown {
  private BigDecimal amount;
  private BigDecimal percentageFee;
  private BigDecimal flatFee;
  private BigDecimal totalFee;
  private BigDecimal vat;
  private BigDecimal totalWithVat;
  private String scheme;
}
