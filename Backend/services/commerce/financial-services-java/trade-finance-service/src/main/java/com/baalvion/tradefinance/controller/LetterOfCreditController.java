package com.baalvion.tradefinance.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.tradefinance.dto.*;
import com.baalvion.tradefinance.service.LetterOfCreditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** REST API for documentary credits (UCP 600). All routes are tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/letters-of-credit")
@RequiredArgsConstructor
public class LetterOfCreditController {

  private final LetterOfCreditService service;

  @PostMapping
  public ResponseEntity<LcResponse> issue(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody IssueLcRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantHeader);
    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.issue(tenantId, request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<LcResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping
  public ResponseEntity<Page<LcResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) UUID beneficiaryId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenantHeader), status, beneficiaryId, page, size));
  }

  @PostMapping("/{id}/advise")
  public ResponseEntity<LcResponse> advise(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.advise(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<LcResponse> cancel(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.cancel(TenantContext.resolve(tenantHeader), id, reason));
  }

  // --- amendments ---

  @PostMapping("/{id}/amendments")
  public ResponseEntity<LcAmendmentResponse> amend(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @Valid @RequestBody AmendLcRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.amend(TenantContext.resolve(tenantHeader), id, request));
  }

  @GetMapping("/{id}/amendments")
  public ResponseEntity<List<LcAmendmentResponse>> listAmendments(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.listAmendments(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/{id}/amendments/{amendmentId}/decision")
  public ResponseEntity<LcAmendmentResponse> decideAmendment(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @PathVariable UUID amendmentId,
    @RequestParam boolean accept
  ) {
    return ResponseEntity.ok(service.decideAmendment(TenantContext.resolve(tenantHeader), id, amendmentId, accept));
  }

  // --- presentations ---

  @PostMapping("/{id}/presentations")
  public ResponseEntity<LcPresentationResponse> present(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @Valid @RequestBody PresentDocumentsRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.present(TenantContext.resolve(tenantHeader), id, request));
  }

  @GetMapping("/{id}/presentations")
  public ResponseEntity<List<LcPresentationResponse>> listPresentations(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.listPresentations(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/{id}/presentations/{presentationId}/examine")
  public ResponseEntity<LcPresentationResponse> examine(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @PathVariable UUID presentationId,
    @RequestBody(required = false) Map<String, List<String>> body
  ) {
    List<String> discrepancies = body != null ? body.get("discrepancies") : null;
    return ResponseEntity.ok(service.examine(TenantContext.resolve(tenantHeader), id, presentationId, discrepancies));
  }

  @PostMapping("/{id}/presentations/{presentationId}/waive")
  public ResponseEntity<LcPresentationResponse> waive(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @PathVariable UUID presentationId
  ) {
    return ResponseEntity.ok(service.waiveDiscrepancies(TenantContext.resolve(tenantHeader), id, presentationId));
  }

  @PostMapping("/{id}/presentations/{presentationId}/reject")
  public ResponseEntity<LcPresentationResponse> reject(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @PathVariable UUID presentationId,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.rejectPresentation(TenantContext.resolve(tenantHeader), id, presentationId, reason));
  }

  @PostMapping("/{id}/presentations/{presentationId}/settle")
  public ResponseEntity<LcPresentationResponse> settle(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @PathVariable UUID presentationId
  ) {
    return ResponseEntity.ok(service.settle(TenantContext.resolve(tenantHeader), id, presentationId));
  }
}
