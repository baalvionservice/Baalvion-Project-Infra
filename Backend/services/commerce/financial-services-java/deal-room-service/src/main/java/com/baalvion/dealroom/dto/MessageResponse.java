package com.baalvion.dealroom.dto;

import com.baalvion.dealroom.domain.DealMessage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MessageResponse {
  private UUID id;
  private UUID dealId;
  private String senderId;
  private String senderRole;
  private String body;
  private String kind;
  private LocalDateTime createdAt;

  public static MessageResponse from(DealMessage m) {
    return MessageResponse.builder()
      .id(m.getId()).dealId(m.getDealId()).senderId(m.getSenderId()).senderRole(m.getSenderRole())
      .body(m.getBody()).kind(m.getKind() != null ? m.getKind().name() : null).createdAt(m.getCreatedAt())
      .build();
  }
}
