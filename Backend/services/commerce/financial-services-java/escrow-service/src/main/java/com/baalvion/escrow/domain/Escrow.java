package com.baalvion.escrow.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Escrow: A conditional fund hold
 *
 * Funds are debited from a source account into an escrow suspense account on
 * creation (HELD). They are later credited to the beneficiary (RELEASED) or
 * returned to the source (REFUNDED). Time-based holds auto-resolve at {@code releaseAt}.
 */
@Entity
@Table(
  name = "escrows",
  schema = "escrow",
  indexes = {
    @Index(name = "idx_tenant_status_date", columnList = "tenant_id,status,created_at DESC"),
    @Index(name = "idx_source_account", columnList = "source_account_id,tenant_id"),
    @Index(name = "idx_beneficiary_account", columnList = "beneficiary_account_id,tenant_id"),
    @Index(name = "idx_release_at", columnList = "status,release_condition,release_at")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_escrow_ref", columnNames = {"escrow_ref", "tenant_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Escrow {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull(message = "Tenant ID required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank(message = "Escrow reference required")
  @Size(max = 64, message = "Escrow reference must not exceed 64 characters")
  @Column(length = 64, nullable = false)
  private String escrowRef;

  @NotNull(message = "Source account required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID sourceAccountId;

  @NotNull(message = "Beneficiary account required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID beneficiaryAccountId;

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
  @Digits(integer = 15, fraction = 4, message = "Amount must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal amount;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  @Column(length = 3, nullable = false)
  private String currency;

  @NotNull(message = "Status required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EscrowStatus status;

  @NotNull(message = "Release condition required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ReleaseCondition releaseCondition;

  /** Auto-resolution time for TIME_BASED holds. */
  @Column
  private LocalDateTime releaseAt;

  /** Whether a TIME_BASED hold auto-releases (true) or auto-refunds (false) at expiry. */
  @Column(nullable = false)
  private boolean autoReleaseOnExpiry;

  @Column
  private LocalDateTime releasedAt;

  @Column
  private LocalDateTime refundedAt;

  @Column(columnDefinition = "TEXT")
  private String disputeReason;

  /** Ledger journal id for the original hold posting. */
  @Column(columnDefinition = "uuid")
  private UUID ledgerJournalId;

  @Column(columnDefinition = "jsonb", nullable = false)
  private String metadata;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  public enum EscrowStatus {
    HELD,
    RELEASED,
    REFUNDED,
    DISPUTED,
    EXPIRED
  }

  public enum ReleaseCondition {
    TIME_BASED,
    EVENT_BASED,
    MANUAL
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (metadata == null) {
      metadata = "{}";
    }
  }
}
