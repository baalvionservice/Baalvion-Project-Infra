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
public class DltMessageResponse {
  private UUID id;
  private String dltTopic;
  private String originalTopic;
  private String eventKey;
  private String payload;
  private String exceptionMessage;
  private String status;
  private String replayedBy;
  private LocalDateTime replayedAt;
  private LocalDateTime createdAt;
}
