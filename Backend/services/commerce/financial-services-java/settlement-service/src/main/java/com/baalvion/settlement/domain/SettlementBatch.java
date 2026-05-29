package com.baalvion.settlement.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * SettlementBatch: A net settlement run for a scheme on a settlement date
 *
 * Aggregates a set of {@link SettlementItem}s into gross/fee/net positions and is
 * materialised into a scheme-specific settlement file at generation time.
 */
@Entity
@Table(
  name = "settlement_batches",
  schema = "settlement",
  indexes = {
    @Index(name = "idx_tenant_status_date", columnList = "tenant_id,status,settlement_date DESC"),
    @Index(name = "idx_tenant_scheme", columnList = "tenant_id,scheme,settlement_date DESC")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_batch_ref", columnNames = {"batch_ref", "tenant_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementBatch {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank
  @Size(max = 64)
  @Column(length = 64, nullable = false)
  private String batchRef;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Scheme scheme;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SettlementType settlementType;

  @NotNull
  @Column(nullable = false)
  private LocalDate settlementDate;

  @NotBlank
  @Size(min = 3, max = 3)
  @Column(length = 3, nullable = false)
  private String currency;

  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal totalAmount;

  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal totalFees;

  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal netAmount;

  @Column(nullable = false)
  private int recordCount;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BatchStatus status;

  @Column(length = 128)
  private String fileName;

  @Column(columnDefinition = "TEXT")
  private String fileContent;

  @Column(length = 64)
  private String fileChecksum;

  @Column
  private LocalDateTime generatedAt;

  @Column
  private LocalDateTime submittedAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  public enum Scheme {
    NIP,
    VISA,
    MASTERCARD,
    INTERSWITCH,
    WALLET
  }

  public enum SettlementType {
    T0,
    T1
  }

  public enum BatchStatus {
    PENDING,
    GENERATED,
    SUBMITTED,
    RECONCILED,
    FAILED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (totalAmount == null) {
      totalAmount = BigDecimal.ZERO;
    }
    if (totalFees == null) {
      totalFees = BigDecimal.ZERO;
    }
    if (netAmount == null) {
      netAmount = BigDecimal.ZERO;
    }
  }
}
