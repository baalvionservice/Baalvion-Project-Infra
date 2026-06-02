package com.baalvion.fx.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.fx.dto.*;
import com.baalvion.fx.service.FxDealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Spot conversions and rate-locks. Tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/fx")
@RequiredArgsConstructor
public class FxDealController {

  private final FxDealService dealService;

  // --- spot ---

  @PostMapping("/conversions")
  public ResponseEntity<ConversionResponse> convert(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody ConvertRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantHeader);
    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(dealService.convert(tenantId, request));
  }

  @GetMapping("/conversions/{id}")
  public ResponseEntity<ConversionResponse> getConversion(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(dealService.getConversion(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping("/conversions")
  public ResponseEntity<Page<ConversionResponse>> listConversions(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(dealService.listConversions(TenantContext.resolve(tenantHeader), page, size));
  }

  // --- rate-locks ---

  @PostMapping("/rate-locks")
  public ResponseEntity<RateLockResponse> lock(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody RateLockRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantHeader);
    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(dealService.lock(tenantId, request));
  }

  @PostMapping("/rate-locks/{id}/execute")
  public ResponseEntity<ConversionResponse> execute(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(dealService.executeLock(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/rate-locks/{id}/cancel")
  public ResponseEntity<RateLockResponse> cancel(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(dealService.cancelLock(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping("/rate-locks/{id}")
  public ResponseEntity<RateLockResponse> getLock(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(dealService.getLock(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping("/rate-locks")
  public ResponseEntity<Page<RateLockResponse>> listLocks(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(dealService.listLocks(TenantContext.resolve(tenantHeader), status, page, size));
  }
}
