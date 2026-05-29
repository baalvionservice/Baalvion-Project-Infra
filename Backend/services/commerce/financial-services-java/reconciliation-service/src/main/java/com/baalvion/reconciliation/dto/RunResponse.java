package com.baalvion.reconciliation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RunResponse {
  private UUID id;
  private UUID tenantId;
  private String runRef;
  private String sourceFile;
  private String batchRef;
  private int totalRecords;
  private int matchedCount;
  private int exceptionCount;
  private int unmatchedCount;
  private String status;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
