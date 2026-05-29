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
public class WebhookSubscriptionResponse {
  private UUID id;
  private UUID tenantId;
  private String url;
  private String eventPattern;
  private boolean active;
  /** Returned ONLY on creation so the caller can store it; never echoed afterwards. */
  private String secret;
  private LocalDateTime createdAt;
}
