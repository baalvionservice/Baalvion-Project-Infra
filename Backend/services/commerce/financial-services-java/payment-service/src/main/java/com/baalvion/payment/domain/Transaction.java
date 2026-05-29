package com.baalvion.payment.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Transaction: Payment with scheme-specific fees and idempotency
 *
 * Represents a single payment: source account → destination account.
 * Includes tiered fee calculation based on payment scheme.
 * Idempotency key prevents duplicate processing within 24 hours.
 */
@Entity
@Table(
  name = "transactions",
  schema = "payments",
  indexes = {
    @Index(name = "idx_tenant_status_date", columnList = "tenant_id,status,created_at DESC"),
    @Index(name = "idx_source_account", columnList = "source_account_id,tenant_id"),
    @Index(name = "idx_destination_account", columnList = "destination_account_id,tenant_id"),
    @Index(name = "idx_idempotency_key", columnList = "idempotency_key,tenant_id"),
    @Index(name = "idx_payment_scheme", columnList = "payment_scheme,status")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_idempotency_key", columnNames = {"idempotency_key", "tenant_id"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull(message = "Tenant ID required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank(message = "Idempotency key required")
  @Size(max = 128, message = "Idempotency key must not exceed 128 characters")
  @Column(length = 128, nullable = false)
  private String idempotencyKey;

  @NotNull(message = "Source account required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID sourceAccountId;

  @NotNull(message = "Destination account required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID destinationAccountId;

  @NotNull(message = "Amount required")
  @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
  @Digits(integer = 15, fraction = 2, message = "Amount must have max 15 digits and 2 decimals")
  @Column(precision = 19, scale = 2, nullable = false)
  private BigDecimal amount;

  @NotNull(message = "Fee required")
  @DecimalMin(value = "0.00", message = "Fee must be non-negative")
  @Digits(integer = 15, fraction = 4, message = "Fee must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal fee;

  @NotNull(message = "VAT required")
  @DecimalMin(value = "0.00", message = "VAT must be non-negative")
  @Digits(integer = 15, fraction = 4, message = "VAT must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal vat;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  @Column(length = 3, nullable = false)
  private String currency;

  @NotNull(message = "Payment scheme required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PaymentScheme paymentScheme;

  @NotNull(message = "Status required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TransactionStatus status;

  @Column(columnDefinition = "uuid")
  private UUID ledgerJournalId;

  /** External scheme reference returned by the downstream scheme adapter. */
  @Size(max = 64)
  @Column(length = 64)
  private String schemeRef;

  /** Authenticated subject that initiated the payment (for ABAC ownership checks, §7.1). */
  @Size(max = 128)
  @Column(length = 128)
  private String initiatedBy;

  @Column(columnDefinition = "TEXT")
  private String metadata;

  @Column(columnDefinition = "TEXT")
  private String failureReason;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @Version
  private Long version;

  public enum PaymentScheme {
    NIP,
    VISA,
    MASTERCARD,
    INTERSWITCH,
    WALLET,
    INTERNAL,
    ESCROW
  }

  public enum TransactionStatus {
    INITIATED,
    COMPLETED,
    FAILED,
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
