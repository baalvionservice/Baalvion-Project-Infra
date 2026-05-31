package com.baalvion.fx.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.fx.dto.ForwardRequest;
import com.baalvion.fx.dto.ForwardResponse;
import com.baalvion.fx.service.ForwardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** FX forward contracts. Tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/fx/forwards")
@RequiredArgsConstructor
public class ForwardController {

  private final ForwardService forwardService;

  @PostMapping
  public ResponseEntity<ForwardResponse> book(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody ForwardRequest request
  ) {
    UUID tenantId = TenantContext.resolve(tenantHeader);
    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(forwardService.book(tenantId, request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ForwardResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(forwardService.get(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping
  public ResponseEntity<Page<ForwardResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(forwardService.list(TenantContext.resolve(tenantHeader), status, page, size));
  }

  @PostMapping("/{id}/settle")
  public ResponseEntity<ForwardResponse> settle(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(forwardService.settle(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<ForwardResponse> cancel(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(forwardService.cancel(TenantContext.resolve(tenantHeader), id, reason));
  }
}
