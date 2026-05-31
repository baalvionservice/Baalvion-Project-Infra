package com.baalvion.wallet.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** A holder's wallet within a tenant. Holds one balance per currency. */
@Entity
@Table(name = "wallets", schema = "wallet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Column(name = "holder_id", nullable = false, columnDefinition = "uuid")
  private UUID holderId;

  @Enumerated(EnumType.STRING)
  @Column(name = "holder_type", nullable = false, length = 20)
  @Builder.Default
  private HolderType holderType = HolderType.USER;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private WalletStatus status = WalletStatus.ACTIVE;

  @Column(name = "default_currency", length = 3)
  private String defaultCurrency;

  @Column(length = 255)
  private String label;

  @Column(name = "created_by", length = 255)
  private String createdBy;

  @Column(columnDefinition = "jsonb", nullable = false)
  @Builder.Default
  private String metadata = "{}";

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public enum HolderType { USER, ORGANIZATION, MERCHANT, PLATFORM }

  public enum WalletStatus { ACTIVE, FROZEN, CLOSED }
}
