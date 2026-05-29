package com.baalvion.settlement.dto;

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
public class SettlementItemResponse {
  private UUID id;
  private UUID batchId;
  private UUID transactionId;
  private String transactionRef;
  private BigDecimal amount;
  private BigDecimal fee;
  private String status;
  private LocalDateTime createdAt;
}
