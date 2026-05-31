package com.baalvion.account.domain;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * KycDocument: an encrypted-at-rest KYC document for an account (design §6.4 KYC documents).
 *
 * The document bytes are stored as AES-256-GCM ciphertext (+ per-document IV); a SHA-256 of the
 * plaintext is kept for integrity/dedup. Tenant-isolated via RLS. Retention is enforced by
 * {@code expiresAt} + a scheduled purge. (Object storage / MongoDB are alternative stores behind
 * the same service API — see ADR 0011; Postgres + app-level encryption is the implemented default.)
 */
@Entity
@Table(
  name = "kyc_documents",
  schema = "accounts",
  indexes = {
    @Index(name = "idx_kyc_tenant_account", columnList = "tenant_id,account_id"),
    @Index(name = "idx_kyc_tenant_type", columnList = "tenant_id,document_type"),
    @Index(name = "idx_kyc_expires", columnList = "expires_at")
  }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycDocument {

  @Id
  @Column(columnDefinition = "uuid")
  private UUID id;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID tenantId;

  @Column(columnDefinition = "uuid", nullable = false)
  private UUID accountId;

  @Column(length = 32, nullable = false)
  private String documentType;          // PASSPORT, NATIONAL_ID, DRIVERS_LICENSE, UTILITY_BILL, ...

  @Column(length = 200, nullable = false)
  private String fileName;

  @Column(length = 100, nullable = false)
  private String contentType;

  /**
   * AES-256-GCM ciphertext of the document bytes. Mapped to Postgres {@code bytea} (matching the
   * migration); no {@code @Lob}, which under Hibernate 6 would map {@code byte[]} to a Large Object
   * ({@code oid}) and fail schema validation against the {@code bytea} column.
   */
  @Column(name = "ciphertext", nullable = false)
  private byte[] ciphertext;

  /** Per-document GCM IV/nonce. */
  @Column(name = "iv", nullable = false)
  private byte[] iv;

  /** SHA-256 of the plaintext (integrity + dedup). */
  @Column(length = 64, nullable = false)
  private String sha256;

  @Column(nullable = false)
  private long sizeBytes;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private KycDocumentStatus status;

  @Column(length = 128)
  private String uploadedBy;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  /** Retention horizon; purged after this instant. */
  @Column
  private LocalDateTime expiresAt;

  @Version
  private Long version;

  public enum KycDocumentStatus {
    PENDING,
    VERIFIED,
    REJECTED
  }

  @PrePersist
  protected void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    if (status == null) {
      status = KycDocumentStatus.PENDING;
    }
  }
}
