package com.baalvion.wallet.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** An append-only ledger entry recording one balance movement. */
@Entity
@Table(name = "wallet_entries", schema = "wallet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletEntry {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "wallet_id", nullable = false, columnDefinition = "uuid")
  private UUID walletId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(nullable = false, length = 3)
  private String currency;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 8)
  private Direction direction;

  @Enumerated(EnumType.STRING)
  @Column(name = "entry_type", nullable = false, length = 20)
  private EntryType entryType;

  @Column(nullable = false, precision = 19, scale = 4)
  private BigDecimal amount;

  @Column(name = "balance_after", nullable = false, precision = 19, scale = 4)
  private BigDecimal balanceAfter;

  @Column(name = "idempotency_key", nullable = false, length = 255)
  private String idempotencyKey;

  @Column(length = 255)
  private String reference;

  @Column(name = "related_entry_id", columnDefinition = "uuid")
  private UUID relatedEntryId;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public enum Direction { CREDIT, DEBIT }

  public enum EntryType {
    DEPOSIT, WITHDRAWAL, HOLD, RELEASE, CAPTURE,
    TRANSFER_IN, TRANSFER_OUT, CONVERT_IN, CONVERT_OUT, ADJUSTMENT
  }
}
