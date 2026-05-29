package com.baalvion.ledger.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JournalEntry: Immutable double-entry bookkeeping record
 *
 * Every transaction posts a pair: debit one account, credit another.
 * Ensures ledger always balances: sum(debits) = sum(credits).
 */
@Entity
@Table(
  name = "journal_entries",
  schema = "ledger",
  indexes = {
    @Index(name = "idx_tenant_status_date", columnList = "tenant_id,status,posted_at DESC"),
    @Index(name = "idx_debit_account", columnList = "debit_account_id,tenant_id"),
    @Index(name = "idx_credit_account", columnList = "credit_account_id,tenant_id"),
    @Index(name = "idx_tenant_date", columnList = "tenant_id,posted_at DESC")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_transaction_ref", columnNames = {"transaction_ref", "tenant_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull(message = "Tenant ID required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank(message = "Transaction reference required")
  @Size(max = 64, message = "Transaction reference must not exceed 64 characters")
  @Column(length = 64, nullable = false)
  private String transactionRef;

  @NotNull(message = "Debit account required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID debitAccountId;

  @NotNull(message = "Credit account required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID creditAccountId;

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
  @Digits(integer = 15, fraction = 4, message = "Amount must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal amount;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  @Column(length = 3, nullable = false)
  private String currency;

  @NotNull(message = "Entry type required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EntryType entryType;

  @NotNull(message = "Status required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EntryStatus status;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(columnDefinition = "uuid")
  private UUID relatedTransactionId;

  @Column(nullable = true)
  private LocalDateTime postedAt;

  @Column(nullable = true)
  private LocalDateTime reversedAt;

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

  public enum EntryType {
    PAYMENT,
    FEE,
    REVERSAL,
    SETTLEMENT,
    ESCROW,
    REFUND,
    ADJUSTMENT
  }

  public enum EntryStatus {
    PENDING,
    POSTED,
    REVERSED
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
