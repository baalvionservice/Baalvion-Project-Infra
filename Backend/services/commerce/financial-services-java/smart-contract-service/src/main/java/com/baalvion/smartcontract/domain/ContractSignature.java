package com.baalvion.smartcontract.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/** A required signature on a contract — one row per signing party. */
@Entity
@Table(name = "contract_signatures", schema = "smart_contract")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractSignature {

  @Id
  @Column(columnDefinition = "uuid")
  @Builder.Default
  private UUID id = UUID.randomUUID();

  @Column(name = "contract_id", nullable = false, columnDefinition = "uuid")
  private UUID contractId;

  @Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
  private UUID tenantId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private Party party;

  @Column(name = "signer_name", length = 255)
  private String signerName;

  @Column(name = "signer_email", length = 255)
  private String signerEmail;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  @Builder.Default
  private SignatureStatus status = SignatureStatus.PENDING;

  @Column(name = "provider_ref", length = 255)
  private String providerRef;

  @Column(name = "signed_at")
  private LocalDateTime signedAt;

  @Column(name = "declined_reason", columnDefinition = "TEXT")
  private String declinedReason;

  @Column(name = "ip_address", length = 45)
  private String ipAddress;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public enum Party { BUYER, SELLER, WITNESS }

  public enum SignatureStatus { PENDING, SIGNED, DECLINED, EXPIRED }
}
