package com.baalvion.tradefinance.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.tradefinance.dto.*;
import com.baalvion.tradefinance.service.BankGuaranteeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** REST API for independent bank guarantees (URDG 758 / ISP98). All routes are tenant-scoped. */
@Slf4j
@RestController
@RequestMapping("/api/v1/bank-guarantees")
@RequiredArgsConstructor
public class BankGuaranteeController {

  private final BankGuaranteeService service;

  @PostMapping
  public ResponseEntity<GuaranteeResponse> issue(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody IssueGuaranteeRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantHeader);
    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.issue(tenantId, request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<GuaranteeResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping
  public ResponseEntity<Page<GuaranteeResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) UUID beneficiaryId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenantHeader), status, beneficiaryId, page, size));
  }

  @PostMapping("/{id}/amend")
  public ResponseEntity<GuaranteeResponse> amend(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @RequestParam(required = false) BigDecimal newAmount,
    @RequestParam(required = false) LocalDate newExpiryDate
  ) {
    return ResponseEntity.ok(service.amend(TenantContext.resolve(tenantHeader), id, newAmount, newExpiryDate));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<GuaranteeResponse> cancel(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.cancel(TenantContext.resolve(tenantHeader), id, reason));
  }

  @PostMapping("/{id}/release")
  public ResponseEntity<GuaranteeResponse> release(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.release(TenantContext.resolve(tenantHeader), id));
  }

  // --- claims (demands) ---

  @PostMapping("/{id}/claims")
  public ResponseEntity<GuaranteeClaimResponse> makeClaim(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @Valid @RequestBody MakeClaimRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.makeClaim(TenantContext.resolve(tenantHeader), id, request));
  }

  @GetMapping("/{id}/claims")
  public ResponseEntity<List<GuaranteeClaimResponse>> listClaims(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.listClaims(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/{id}/claims/{claimId}/decision")
  public ResponseEntity<GuaranteeClaimResponse> decideClaim(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @PathVariable UUID claimId,
    @RequestParam boolean pay,
    @RequestBody(required = false) Map<String, String> body
  ) {
    String reason = body != null ? body.get("reason") : null;
    return ResponseEntity.ok(service.decideClaim(TenantContext.resolve(tenantHeader), id, claimId, pay, reason));
  }
}
