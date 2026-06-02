package com.baalvion.credit.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.credit.dto.*;
import com.baalvion.credit.service.BnplService;
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

/** REST API for trade BNPL. Tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/bnpl")
@RequiredArgsConstructor
public class BnplController {

  private final BnplService service;

  @PostMapping("/plans")
  public ResponseEntity<BnplPlanResponse> create(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody CreateBnplPlanRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantHeader);
    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(tenantId, request));
  }

  @GetMapping("/plans/{id}")
  public ResponseEntity<BnplPlanResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping("/plans")
  public ResponseEntity<Page<BnplPlanResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) UUID buyerId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenantHeader), status, buyerId, page, size));
  }

  @PostMapping("/plans/{id}/disburse")
  public ResponseEntity<BnplPlanResponse> disburse(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.disburse(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/plans/{id}/repayments")
  public ResponseEntity<BnplPlanResponse> repay(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @Valid @RequestBody RepaymentRequest request
  ) {
    return ResponseEntity.ok(service.repay(TenantContext.resolve(tenantHeader), id, request));
  }

  @GetMapping("/plans/{id}/installments")
  public ResponseEntity<List<BnplInstallmentResponse>> installments(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.listInstallments(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/plans/{id}/cancel")
  public ResponseEntity<BnplPlanResponse> cancel(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.cancel(TenantContext.resolve(tenantHeader), id, reason));
  }

  @PostMapping("/plans/{id}/write-off")
  public ResponseEntity<BnplPlanResponse> writeOff(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @RequestBody(required = false) Map<String, String> body
  ) {
    String reason = body != null ? body.get("reason") : null;
    return ResponseEntity.ok(service.writeOff(TenantContext.resolve(tenantHeader), id, reason));
  }
}
