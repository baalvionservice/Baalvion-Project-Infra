package com.baalvion.account.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Account: Multi-tenant ledger account
 *
 * Represents a money-holding account (individual, business, or one of the internal
 * suspense accounts: escrow, settlement, fee). Carries an available {@code balance}
 * and a {@code ledgerBalance} (posted balance including pending holds), plus a KYC
 * state machine and a configurable daily transaction limit.
 */
@Entity
@Table(
  name = "accounts",
  schema = "accounts",
  indexes = {
    @Index(name = "idx_tenant_type", columnList = "tenant_id,account_type"),
    @Index(name = "idx_tenant_kyc", columnList = "tenant_id,kyc_status"),
    @Index(name = "idx_tenant_created", columnList = "tenant_id,created_at DESC")
  },
  uniqueConstraints = {
    @UniqueConstraint(name = "uk_account_number", columnNames = {"account_number"})
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @NotNull(message = "Tenant ID required")
  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @NotBlank(message = "Account number required")
  @Size(max = 20, message = "Account number must not exceed 20 characters")
  @Column(length = 20, nullable = false)
  private String accountNumber;

  @Size(max = 140, message = "Account name must not exceed 140 characters")
  @Column(length = 140)
  private String accountName;

  @NotNull(message = "Account type required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AccountType accountType;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  @Column(length = 3, nullable = false)
  private String currency;

  @NotNull(message = "Balance required")
  @Digits(integer = 15, fraction = 4, message = "Balance must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal balance;

  @NotNull(message = "Ledger balance required")
  @Digits(integer = 15, fraction = 4, message = "Ledger balance must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal ledgerBalance;

  @NotNull(message = "KYC status required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private KycStatus kycStatus;

  @NotNull(message = "Daily limit required")
  @Digits(integer = 15, fraction = 4, message = "Daily limit must have max 15 digits and 4 decimals")
  @Column(precision = 19, scale = 4, nullable = false)
  private BigDecimal dailyLimit;

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

  public enum AccountType {
    INDIVIDUAL,
    BUSINESS,
    ESCROW,
    SETTLEMENT,
    FEE
  }

  public enum KycStatus {
    PENDING,
    APPROVED,
    REJECTED,
    SUSPENDED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (metadata == null) {
      metadata = "{}";
    }
    if (balance == null) {
      balance = BigDecimal.ZERO;
    }
    if (ledgerBalance == null) {
      ledgerBalance = BigDecimal.ZERO;
    }
  }
}
