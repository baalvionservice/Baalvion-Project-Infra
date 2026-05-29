package com.baalvion.reporting.dto;

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
public class ReportResponse {
  private UUID id;
  private UUID tenantId;
  private String reportRef;
  private String reportType;
  private String format;
  private String status;
  private int rowCount;
  private String contentType;
  private String fileName;
  private String failureReason;
  private String requestedBy;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime completedAt;
}
