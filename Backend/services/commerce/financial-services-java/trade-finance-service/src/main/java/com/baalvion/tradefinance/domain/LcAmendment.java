package com.baalvion.tradefinance.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An amendment to a Letter of Credit. Per UCP 600 art.10 an amendment is not binding on the
 * beneficiary until accepted, so amendments are PROPOSED until consent is recorded.
 */
@Entity
@Table(name = "lc_amendments", schema = "trade_finance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LcAmendment {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "lc_id", nullable = false, columnDefinition = "uuid")
  private UUID lcId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "amendment_number", nullable = false)
  private int amendmentNumber;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private AmendmentStatus status = AmendmentStatus.PROPOSED;

  @Column(name = "new_amount", precision = 19, scale = 4)
  private BigDecimal newAmount;

  @Column(name = "new_expiry_date")
  private LocalDate newExpiryDate;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String changes = "{}";

  @Column(columnDefinition = "TEXT")
  private String reason;

  @Column(name = "requires_consent", nullable = false)
  @Builder.Default
  private boolean requiresConsent = true;

  @Column(name = "consented_by", length = 255)
  private String consentedBy;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "decided_at")
  private LocalDateTime decidedAt;

  public enum AmendmentStatus { PROPOSED, ACCEPTED, REJECTED }
}
