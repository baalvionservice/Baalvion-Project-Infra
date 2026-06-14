package com.baalvion.settlement.controller;

import com.baalvion.settlement.dto.BatchResponse;
import com.baalvion.settlement.dto.CreateBatchRequest;
import com.baalvion.settlement.dto.SettlementItemResponse;
import com.baalvion.settlement.service.SettlementService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/settlement")
public class SettlementController {

  private final SettlementService settlementService;

  public SettlementController(SettlementService settlementService) {
    this.settlementService = settlementService;
  }

  @PostMapping("/batches")
  public ResponseEntity<BatchResponse> createBatch(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody CreateBatchRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /settlement/batches: tenant={}, ref={}, scheme={}, items={}",
      tenantId, request.getBatchRef(), request.getScheme(), request.getItems().size());

    BatchResponse response = settlementService.createBatch(tenantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/batches/{id}")
  public ResponseEntity<BatchResponse> getBatch(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(settlementService.getBatch(tenantId, id));
  }

  @GetMapping("/batches")
  public ResponseEntity<Page<BatchResponse>> listBatches(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String scheme,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(settlementService.listBatches(tenantId, scheme, status, page, size));
  }

  @PostMapping("/batches/{id}/generate")
  public ResponseEntity<BatchResponse> generate(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /settlement/batches/{}/generate: tenant={}", id, tenantId);
    return ResponseEntity.ok(settlementService.generateFile(tenantId, id));
  }

  // War Room 3: submitting a settlement batch disburses funds — restrict to finance/admin.
  @PreAuthorize("hasAnyRole('ADMIN','OWNER','SUPER_ADMIN','FINANCE_OFFICER','COMPLIANCE_OFFICER','PLATFORM_ADMIN')")
  @PostMapping("/batches/{id}/submit")
  public ResponseEntity<BatchResponse> submit(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /settlement/batches/{}/submit: tenant={}", id, tenantId);
    return ResponseEntity.ok(settlementService.submit(tenantId, id));
  }

  @GetMapping("/batches/{id}/items")
  public ResponseEntity<List<SettlementItemResponse>> getItems(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(settlementService.getItems(tenantId, id));
  }

  @GetMapping(value = "/batches/{id}/file", produces = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> getFile(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    return ResponseEntity.ok(settlementService.getFileContent(tenantId, id));
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }
}
