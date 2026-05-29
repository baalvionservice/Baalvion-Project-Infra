package com.baalvion.payment.dto;

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
public class ApprovalResponse {
  private UUID id;
  private UUID tenantId;
  private String operation;
  private UUID resourceId;
  private String payload;
  private String status;
  private String makerId;
  private String checkerId;
  private String decisionReason;
  private LocalDateTime createdAt;
  private LocalDateTime decidedAt;
}
