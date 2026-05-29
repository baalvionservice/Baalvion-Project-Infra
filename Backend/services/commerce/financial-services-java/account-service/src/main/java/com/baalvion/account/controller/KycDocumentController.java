package com.baalvion.account.controller;

import com.baalvion.common.security.AuthContext;
import com.baalvion.common.security.TenantContext;
import com.baalvion.account.dto.KycDocumentResponse;
import com.baalvion.account.dto.UpdateKycDocumentStatusRequest;
import com.baalvion.account.dto.UploadKycDocumentRequest;
import com.baalvion.account.service.KycDocumentService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * KYC document vault API (design §6.4). Documents are encrypted at rest; the content endpoint
 * returns decrypted bytes and must be authenticated + audited in production.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/accounts/{accountId}/kyc-documents")
public class KycDocumentController {

  private final KycDocumentService kycService;

  public KycDocumentController(KycDocumentService kycService) {
    this.kycService = kycService;
  }

  @PostMapping
  public ResponseEntity<KycDocumentResponse> upload(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestHeader(value = "X-Actor", required = false) String actor,
    @PathVariable UUID accountId,
    @Valid @RequestBody UploadKycDocumentRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    String uploadedBy = AuthContext.currentUserId().orElse(actor != null ? actor : "anonymous");
    log.info("POST kyc-documents: tenant={}, account={}, type={}", tenantId, accountId, request.getDocumentType());
    return ResponseEntity.status(HttpStatus.CREATED).body(kycService.store(tenantId, accountId, request, uploadedBy));
  }

  @GetMapping
  public ResponseEntity<Page<KycDocumentResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID accountId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(kycService.list(tenantId, accountId, page, size));
  }

  @GetMapping("/{docId}")
  public ResponseEntity<KycDocumentResponse> metadata(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID accountId,
    @PathVariable UUID docId
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    return ResponseEntity.ok(kycService.get(tenantId, docId));
  }

  @GetMapping("/{docId}/content")
  public ResponseEntity<KycDocumentResponse> content(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID accountId,
    @PathVariable UUID docId
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    log.info("GET kyc-document content: tenant={}, doc={}", tenantId, docId);
    return ResponseEntity.ok(kycService.download(tenantId, docId));
  }

  @PatchMapping("/{docId}/status")
  public ResponseEntity<KycDocumentResponse> updateStatus(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestHeader(value = "X-Actor", required = false) String actor,
    @PathVariable UUID accountId,
    @PathVariable UUID docId,
    @Valid @RequestBody UpdateKycDocumentStatusRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    String reviewedBy = AuthContext.currentUserId().orElse(actor != null ? actor : "anonymous");
    return ResponseEntity.ok(kycService.updateStatus(tenantId, docId, request.getStatus(), reviewedBy));
  }

  @DeleteMapping("/{docId}")
  public ResponseEntity<Void> delete(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID accountId,
    @PathVariable UUID docId
  ) {
    UUID tenantId = TenantContext.resolve(tenantIdHeader);
    kycService.delete(tenantId, docId);
    return ResponseEntity.noContent().build();
  }
}
