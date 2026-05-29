package com.baalvion.audit.dto;

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
public class AuditEventResponse {
  private UUID id;
  private UUID tenantId;
  private String eventType;
  private String aggregateType;
  private String aggregateId;
  private String action;
  private String actor;
  private String source;
  private String traceId;
  private String payload;
  private LocalDateTime createdAt;
}
