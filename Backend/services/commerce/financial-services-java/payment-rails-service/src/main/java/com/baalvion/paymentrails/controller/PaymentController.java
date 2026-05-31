package com.baalvion.paymentrails.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.paymentrails.dto.InitiatePaymentRequest;
import com.baalvion.paymentrails.dto.PaymentResponse;
import com.baalvion.paymentrails.service.PaymentRailsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** REST API for multi-rail payments. All routes are tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

  private final PaymentRailsService service;

  @PostMapping
  public ResponseEntity<PaymentResponse> initiate(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody InitiatePaymentRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank() && request.getIdempotencyKey() == null) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.initiate(TenantContext.resolve(tenant), request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<PaymentResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenant), id));
  }

  @GetMapping
  public ResponseEntity<Page<PaymentResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenant), status, page, size));
  }

  @PostMapping("/{id}/settle")
  public ResponseEntity<PaymentResponse> settle(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.settle(TenantContext.resolve(tenant), id));
  }

  @PostMapping("/{id}/fail")
  public ResponseEntity<PaymentResponse> fail(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason,
    @RequestParam(defaultValue = "false") boolean returned
  ) {
    return ResponseEntity.ok(service.fail(TenantContext.resolve(tenant), id, reason, returned));
  }

  @PostMapping("/{id}/cancel")
  public ResponseEntity<PaymentResponse> cancel(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.cancel(TenantContext.resolve(tenant), id, reason));
  }
}
