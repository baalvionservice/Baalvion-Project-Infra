package com.baalvion.aml.controller;

import com.baalvion.aml.dto.AlertResponse;
import com.baalvion.aml.dto.ScreenRequest;
import com.baalvion.aml.dto.ScreenResponse;
import com.baalvion.aml.service.AmlService;
import com.baalvion.common.security.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** REST API for AML transaction monitoring + alert case workflow. All routes are tenant-scoped. */
@Slf4j
@RestController
@RequestMapping("/api/v1/aml")
@RequiredArgsConstructor
public class AmlController {

  private final AmlService service;

  /** Screen a transaction. Returns the outcome; persists + emits an alert only if a rule fires. */
  @PostMapping("/screen")
  public ResponseEntity<ScreenResponse> screen(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody ScreenRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank() && request.getIdempotencyKey() == null) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.ok(service.screen(TenantContext.resolve(tenant), request));
  }

  @GetMapping("/alerts/{id}")
  public ResponseEntity<AlertResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenant), id));
  }

  @GetMapping("/alerts")
  public ResponseEntity<Page<AlertResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenant), status, page, size));
  }

  @PostMapping("/alerts/{id}/investigate")
  public ResponseEntity<AlertResponse> investigate(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam(required = false) String assignedTo
  ) {
    return ResponseEntity.ok(service.investigate(TenantContext.resolve(tenant), id, assignedTo));
  }

  @PostMapping("/alerts/{id}/clear")
  public ResponseEntity<AlertResponse> clear(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam(required = false) String findings
  ) {
    return ResponseEntity.ok(service.clear(TenantContext.resolve(tenant), id, findings));
  }

  @PostMapping("/alerts/{id}/escalate")
  public ResponseEntity<AlertResponse> escalate(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam(required = false) String findings
  ) {
    return ResponseEntity.ok(service.escalate(TenantContext.resolve(tenant), id, findings));
  }

  @PostMapping("/alerts/{id}/file-sar")
  public ResponseEntity<AlertResponse> fileSar(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam(required = false) String findings
  ) {
    return ResponseEntity.ok(service.fileSar(TenantContext.resolve(tenant), id, findings));
  }
}
