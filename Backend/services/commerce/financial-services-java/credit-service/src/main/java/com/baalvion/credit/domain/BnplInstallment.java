package com.baalvion.credit.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** A scheduled installment of a BNPL plan. */
@Entity
@Table(name = "bnpl_installments", schema = "credit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BnplInstallment {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "plan_id", nullable = false, columnDefinition = "uuid")
  private UUID planId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "sequence_no", nullable = false)
  private int sequenceNo;

  @Column(name = "due_date", nullable = false)
  private LocalDate dueDate;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(name = "principal_component", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal principalComponent = BigDecimal.ZERO;

  @Column(name = "interest_component", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal interestComponent = BigDecimal.ZERO;

  @Column(name = "paid_amount", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal paidAmount = BigDecimal.ZERO;

  @Column(name = "late_fee", nullable = false, precision = 19, scale = 4)
  @Builder.Default
  private BigDecimal lateFee = BigDecimal.ZERO;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private InstallmentStatus status = InstallmentStatus.DUE;

  @Column(name = "paid_at")
  private LocalDateTime paidAt;

  public enum InstallmentStatus { DUE, PAID, OVERDUE, WAIVED }
}
