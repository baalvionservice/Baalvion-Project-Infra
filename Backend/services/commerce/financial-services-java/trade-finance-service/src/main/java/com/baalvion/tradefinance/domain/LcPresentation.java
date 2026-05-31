package com.baalvion.tradefinance.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A presentation of documents against a Letter of Credit. The bank examines documents within the
 * UCP 600 art.14(b) window (max 5 banking days) and finds them complying or discrepant. A
 * complying presentation (or a discrepant one waived by the applicant) settles and draws the LC.
 */
@Entity
@Table(name = "lc_presentations", schema = "trade_finance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LcPresentation {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "lc_id", nullable = false, columnDefinition = "uuid")
  private UUID lcId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "presentation_number", nullable = false)
  private int presentationNumber;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private PresentationStatus status = PresentationStatus.SUBMITTED;

  @Column(name = "presented_amount", nullable = false, precision = 19, scale = 4)
  private BigDecimal presentedAmount;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String documents = "[]";

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String discrepancies = "[]";

  @Column(name = "examination_due_date")
  private LocalDate examinationDueDate;

  @Column(name = "examined_by", length = 255)
  private String examinedBy;

  @Column(nullable = false)
  @Builder.Default
  private boolean waived = false;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "examined_at")
  private LocalDateTime examinedAt;

  @Column(name = "settled_at")
  private LocalDateTime settledAt;

  public enum PresentationStatus { SUBMITTED, UNDER_EXAMINATION, COMPLYING, DISCREPANT, WAIVED, REJECTED, SETTLED }
}
