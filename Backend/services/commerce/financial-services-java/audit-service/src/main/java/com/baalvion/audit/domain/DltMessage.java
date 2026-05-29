package com.baalvion.audit.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DltMessage: a record captured from a dead-letter topic ({@code <topic>.DLT}).
 *
 * Gives ops visibility into poison messages and a one-click replay back to the original
 * topic (design §4.3 "DLT monitor + manual replay tool").
 */
@Entity
@Table(
  name = "dlt_messages",
  schema = "audit",
  indexes = {
    @Index(name = "idx_dlt_status_created", columnList = "status,created_at DESC"),
    @Index(name = "idx_dlt_original_topic", columnList = "original_topic")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DltMessage {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(length = 160, nullable = false)
  private String dltTopic;

  @Column(length = 160, nullable = false)
  private String originalTopic;

  @Column(length = 160)
  private String eventKey;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String payload;

  @Column(columnDefinition = "TEXT")
  private String exceptionMessage;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DltStatus status;

  @Size(max = 128)
  @Column(length = 128)
  private String replayedBy;

  @Column
  private LocalDateTime replayedAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  public enum DltStatus {
    DEAD,
    REPLAYED,
    DISCARDED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (payload == null) {
      payload = "{}";
    }
    if (status == null) {
      status = DltStatus.DEAD;
    }
  }
}
