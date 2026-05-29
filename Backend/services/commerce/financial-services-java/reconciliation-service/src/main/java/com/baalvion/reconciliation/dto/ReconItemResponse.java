package com.baalvion.reconciliation.dto;

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
public class ReconItemResponse {
  private UUID id;
  private UUID runId;
  private String transactionRef;
  private BigDecimal internalAmount;
  private BigDecimal externalAmount;
  private String status;
  private String exceptionReason;
  private String resolvedBy;
  private LocalDateTime resolvedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
