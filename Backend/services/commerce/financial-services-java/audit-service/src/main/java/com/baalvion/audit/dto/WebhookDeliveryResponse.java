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
public class WebhookDeliveryResponse {
  private UUID id;
  private UUID subscriptionId;
  private String eventType;
  private String status;
  private int attempts;
  private Integer responseStatus;
  private String lastError;
  private LocalDateTime nextAttemptAt;
  private LocalDateTime deliveredAt;
  private LocalDateTime createdAt;
}
