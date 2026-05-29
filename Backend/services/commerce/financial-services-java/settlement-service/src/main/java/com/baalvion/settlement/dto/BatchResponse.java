package com.baalvion.settlement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchResponse {
  private UUID id;
  private UUID tenantId;
  private String batchRef;
  private String scheme;
  private String settlementType;
  private LocalDate settlementDate;
  private String currency;
  private BigDecimal totalAmount;
  private BigDecimal totalFees;
  private BigDecimal netAmount;
  private int recordCount;
  private String status;
  private String fileName;
  private String fileChecksum;
  private LocalDateTime generatedAt;
  private LocalDateTime submittedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
