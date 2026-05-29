package com.baalvion.account.service;

import com.baalvion.account.domain.KycDocument;
import com.baalvion.account.domain.KycDocument.KycDocumentStatus;
import com.baalvion.account.dto.KycDocumentResponse;
import com.baalvion.account.dto.UploadKycDocumentRequest;
import com.baalvion.account.repository.KycDocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Encrypted KYC document vault (design §6.4 / §7.3). Documents are stored AES-256-GCM-encrypted
 * at rest, tenant-isolated (RLS), with integrity hashing, status lifecycle, and retention purge.
 */
@Slf4j
@Service
@Transactional
public class KycDocumentService {

  private final KycDocumentRepository repository;
  private final KycEncryptionService encryption;

  @Value("${app.kyc.max-bytes:10485760}")        // 10 MiB
  private long maxBytes;

  @Value("${app.kyc.retention-days:1825}")       // 5 years
  private int retentionDays;

  public KycDocumentService(KycDocumentRepository repository, KycEncryptionService encryption) {
    this.repository = repository;
    this.encryption = encryption;
  }

  public KycDocumentResponse store(UUID tenantId, UUID accountId, UploadKycDocumentRequest request, String uploadedBy) {
    byte[] plaintext;
    try {
      plaintext = Base64.getDecoder().decode(request.getContentBase64());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("contentBase64 is not valid base64");
    }
    if (plaintext.length == 0) {
      throw new IllegalArgumentException("Document is empty");
    }
    if (plaintext.length > maxBytes) {
      throw new IllegalArgumentException("Document exceeds max size " + maxBytes + " bytes");
    }

    KycEncryptionService.Encrypted enc = encryption.encrypt(plaintext);
    int retention = request.getRetentionDays() != null ? request.getRetentionDays() : retentionDays;

    var doc = KycDocument.builder()
      .tenantId(tenantId)
      .accountId(accountId)
      .documentType(request.getDocumentType())
      .fileName(request.getFileName())
      .contentType(request.getContentType())
      .ciphertext(enc.ciphertext())
      .iv(enc.iv())
      .sha256(sha256(plaintext))
      .sizeBytes(plaintext.length)
      .status(KycDocumentStatus.PENDING)
      .uploadedBy(uploadedBy)
      .expiresAt(LocalDateTime.now().plusDays(retention))
      .build();

    var saved = repository.save(doc);
    log.info("KYC document stored: id={}, tenant={}, account={}, type={}, bytes={}",
      saved.getId(), tenantId, accountId, saved.getDocumentType(), saved.getSizeBytes());
    return metadata(saved);
  }

  @Transactional(readOnly = true)
  public KycDocumentResponse get(UUID tenantId, UUID id) {
    return metadata(load(tenantId, id));
  }

  /** Returns metadata plus the decrypted content (base64). Audit/authorize access to this. */
  @Transactional(readOnly = true)
  public KycDocumentResponse download(UUID tenantId, UUID id) {
    KycDocument doc = load(tenantId, id);
    byte[] plaintext = encryption.decrypt(doc.getCiphertext(), doc.getIv());
    KycDocumentResponse response = metadata(doc);
    response.setContentBase64(Base64.getEncoder().encodeToString(plaintext));
    return response;
  }

  @Transactional(readOnly = true)
  public Page<KycDocumentResponse> list(UUID tenantId, UUID accountId, int page, int size) {
    return repository.findByTenantAndAccount(tenantId, accountId, PageRequest.of(page, size)).map(this::metadata);
  }

  public KycDocumentResponse updateStatus(UUID tenantId, UUID id, String status, String reviewedBy) {
    KycDocument doc = load(tenantId, id);
    doc.setStatus(KycDocumentStatus.valueOf(status));
    var saved = repository.save(doc);
    log.info("KYC document {} status -> {} by {}", id, status, reviewedBy);
    return metadata(saved);
  }

  public void delete(UUID tenantId, UUID id) {
    KycDocument doc = load(tenantId, id);
    repository.delete(doc);
    log.info("KYC document deleted: id={}, tenant={}", id, tenantId);
  }

  /** Retention purge: removes documents past their expiry. Runs hourly. */
  @Scheduled(fixedDelayString = "${app.kyc.purge-ms:3600000}")
  public void purgeExpired() {
    int removed = repository.deleteExpired(LocalDateTime.now());
    if (removed > 0) {
      log.info("KYC retention purge removed {} expired document(s)", removed);
    }
  }

  private KycDocument load(UUID tenantId, UUID id) {
    return repository.findByIdAndTenant(id, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("KYC document not found: " + id));
  }

  private String sha256(byte[] data) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
    } catch (Exception e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }

  private KycDocumentResponse metadata(KycDocument d) {
    return KycDocumentResponse.builder()
      .id(d.getId())
      .accountId(d.getAccountId())
      .documentType(d.getDocumentType())
      .fileName(d.getFileName())
      .contentType(d.getContentType())
      .sha256(d.getSha256())
      .sizeBytes(d.getSizeBytes())
      .status(d.getStatus().name())
      .uploadedBy(d.getUploadedBy())
      .createdAt(d.getCreatedAt())
      .expiresAt(d.getExpiresAt())
      .build();
  }
}
