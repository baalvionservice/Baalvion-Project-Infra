package com.baalvion.risk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentResponse {
  private UUID id;
  private UUID tenantId;
  private UUID transactionId;
  private UUID sourceAccountId;
  private BigDecimal amount;
  private String currency;
  private String scheme;
  private int score;
  private String decision;
  private String reasons;
  private LocalDateTime createdAt;
}
