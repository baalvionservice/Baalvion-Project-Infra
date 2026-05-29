package com.baalvion.escrow.controller;

import com.baalvion.escrow.dto.CreateEscrowRequest;
import com.baalvion.escrow.dto.EscrowActionRequest;
import com.baalvion.escrow.dto.EscrowResponse;
import com.baalvion.escrow.service.EscrowService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/escrow")
public class EscrowController {

  private final EscrowService escrowService;

  public EscrowController(EscrowService escrowService) {
    this.escrowService = escrowService;
  }

  @PostMapping
  public ResponseEntity<EscrowResponse> createHold(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody CreateEscrowRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /escrow: tenant={}, ref={}, amount={}", tenantId, request.getEscrowRef(), request.getAmount());

    EscrowResponse response = escrowService.createHold(tenantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<EscrowResponse> getEscrow(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /escrow/{}: tenant={}", id, tenantId);

    return ResponseEntity.ok(escrowService.getEscrow(tenantId, id));
  }

  @GetMapping
  public ResponseEntity<Page<EscrowResponse>> listEscrows(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /escrow: tenant={}, status={}, page={}, size={}", tenantId, status, page, size);

    return ResponseEntity.ok(escrowService.listEscrows(tenantId, status, page, size));
  }

  @PostMapping("/{id}/release")
  public ResponseEntity<EscrowResponse> release(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @RequestBody(required = false) EscrowActionRequest action
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /escrow/{}/release: tenant={}", id, tenantId);

    return ResponseEntity.ok(escrowService.release(tenantId, id, action));
  }

  @PostMapping("/{id}/refund")
  public ResponseEntity<EscrowResponse> refund(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @RequestBody(required = false) EscrowActionRequest action
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /escrow/{}/refund: tenant={}", id, tenantId);

    return ResponseEntity.ok(escrowService.refund(tenantId, id, action));
  }

  @PostMapping("/{id}/dispute")
  public ResponseEntity<EscrowResponse> dispute(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @RequestBody(required = false) EscrowActionRequest action
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /escrow/{}/dispute: tenant={}", id, tenantId);

    return ResponseEntity.ok(escrowService.dispute(tenantId, id, action));
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }
}
