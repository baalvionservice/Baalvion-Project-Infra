package com.baalvion.settlement.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * SettlementItem: A single transaction line within a {@link SettlementBatch}.
 */
@Entity
@Table(
  name = "settlement_items",
  schema = "settlement",
  indexes = {
    @Index(name = "idx_batch", columnList = "batch_id,tenant_id"),
    @Index(name = "idx_tenant_txn", columnList = "tenant_id,transaction_id")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementItem {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotNull
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID batchId;

  @NotNull
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID transactionId;

  @Size(max = 64)
  @Column(length = 64)
  private String transactionRef;

  @NotNull
  @DecimalMin(value = "0.00")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal amount;

  @NotNull
  @DecimalMin(value = "0.00")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal fee;

  @NotNull
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ItemStatus status;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public enum ItemStatus {
    PENDING,
    SETTLED,
    EXCEPTION
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }
}
