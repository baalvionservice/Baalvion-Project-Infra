package com.baalvion.dispute.dto;

import com.baalvion.dispute.domain.DisputeAction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ActionResponse {
  private UUID id;
  private UUID disputeId;
  private String tier;
  private String actor;
  private String action;
  private String note;
  private LocalDateTime createdAt;

  public static ActionResponse from(DisputeAction a) {
    return ActionResponse.builder()
      .id(a.getId()).disputeId(a.getDisputeId()).tier(a.getTier()).actor(a.getActor())
      .action(a.getAction()).note(a.getNote()).createdAt(a.getCreatedAt())
      .build();
  }
}
