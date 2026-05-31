package com.baalvion.credit.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.credit.dto.*;
import com.baalvion.credit.service.InvoiceFinanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** REST API for invoice finance (factoring / discounting). Tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/invoice-finance")
@RequiredArgsConstructor
public class InvoiceFinanceController {

  private final InvoiceFinanceService service;

  @PostMapping
  public ResponseEntity<InvoiceResponse> submit(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody SubmitInvoiceRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantHeader);
    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.submit(tenantId, request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<InvoiceResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping
  public ResponseEntity<Page<InvoiceResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) UUID sellerId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenantHeader), status, sellerId, page, size));
  }

  @PostMapping("/{id}/fund")
  public ResponseEntity<InvoiceResponse> fund(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.fund(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/{id}/collections")
  public ResponseEntity<InvoiceResponse> collect(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @Valid @RequestBody CollectionRequest request
  ) {
    return ResponseEntity.ok(service.collect(TenantContext.resolve(tenantHeader), id, request));
  }

  @GetMapping("/{id}/collections")
  public ResponseEntity<List<InvoiceCollectionResponse>> listCollections(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.listCollections(TenantContext.resolve(tenantHeader), id));
  }
}
