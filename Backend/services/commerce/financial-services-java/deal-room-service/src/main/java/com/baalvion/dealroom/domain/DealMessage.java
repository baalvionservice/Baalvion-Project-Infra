package com.baalvion.dealroom.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** A message in the deal-room thread: human chat, or a system/offer/event note. */
@Entity
@Table(name = "deal_messages", schema = "deal_room")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealMessage {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "deal_id", nullable = false, columnDefinition = "uuid")
  private UUID dealId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "sender_id", length = 255)
  private String senderId;

  @Column(name = "sender_role", length = 10)
  private String senderRole;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String body;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private MessageKind kind = MessageKind.CHAT;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public enum MessageKind { CHAT, SYSTEM, OFFER, EVENT }
}
