package com.baalvion.reconciliation.controller;

import com.baalvion.reconciliation.dto.ReconItemResponse;
import com.baalvion.reconciliation.dto.ReconcileRequest;
import com.baalvion.reconciliation.dto.ResolveItemRequest;
import com.baalvion.reconciliation.dto.RunResponse;
import com.baalvion.reconciliation.service.ReconciliationService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/reconciliation")
public class ReconciliationController {

  private final ReconciliationService reconciliationService;

  public ReconciliationController(ReconciliationService reconciliationService) {
    this.reconciliationService = reconciliationService;
  }

  @PostMapping("/runs")
  public ResponseEntity<RunResponse> reconcile(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody ReconcileRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /reconciliation/runs: tenant={}, ref={}, internal={}, external={}",
      tenantId, request.getRunRef(), request.getInternalRecords().size(), request.getExternalRecords().size());

    RunResponse response = reconciliationService.reconcile(tenantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/runs/{id}")
  public ResponseEntity<RunResponse> getRun(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(reconciliationService.getRun(tenantId, id));
  }

  @GetMapping("/runs")
  public ResponseEntity<Page<RunResponse>> listRuns(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(reconciliationService.listRuns(tenantId, page, size));
  }

  @GetMapping("/runs/{id}/items")
  public ResponseEntity<List<ReconItemResponse>> getRunItems(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(reconciliationService.getRunItems(tenantId, id));
  }

  @GetMapping("/items")
  public ResponseEntity<Page<ReconItemResponse>> listItems(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(reconciliationService.listItems(tenantId, status, page, size));
  }

  @PostMapping("/items/{id}/resolve")
  public ResponseEntity<ReconItemResponse> resolveItem(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @RequestBody(required = false) ResolveItemRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /reconciliation/items/{}/resolve: tenant={}", id, tenantId);
    return ResponseEntity.ok(reconciliationService.resolveItem(tenantId, id, request));
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }
}
