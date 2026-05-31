package com.baalvion.credit.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** A repayment received from the buyer against a BNPL plan (optionally a specific installment). */
@Entity
@Table(name = "bnpl_repayments", schema = "credit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BnplRepayment {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "plan_id", nullable = false, columnDefinition = "uuid")
  private UUID planId;

  @Column(name = "installment_id", columnDefinition = "uuid")
  private UUID installmentId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(length = 255)
  private String reference;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
