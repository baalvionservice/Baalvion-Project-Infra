package com.baalvion.dispute.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.dispute.dto.*;
import com.baalvion.dispute.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** REST API for three-tier dispute resolution. All routes are tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/disputes")
@RequiredArgsConstructor
public class DisputeController {

  private final DisputeService service;

  @PostMapping
  public ResponseEntity<DisputeResponse> open(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody OpenDisputeRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank() && request.getIdempotencyKey() == null) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.open(TenantContext.resolve(tenant), request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<DisputeResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenant), id));
  }

  @GetMapping
  public ResponseEntity<Page<DisputeResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenant), status, page, size));
  }

  @PostMapping("/{id}/respond")
  public ResponseEntity<DisputeResponse> respond(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam String party, @RequestParam(defaultValue = "false") boolean accept,
    @RequestParam(required = false) String note
  ) {
    return ResponseEntity.ok(service.respond(TenantContext.resolve(tenant), id, party, accept, note));
  }

  // --- Tier 2: mediation ---
  @PostMapping("/{id}/escalate/mediation")
  public ResponseEntity<DisputeResponse> toMediation(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam(required = false) UUID mediatorId
  ) {
    return ResponseEntity.ok(service.escalateToMediation(TenantContext.resolve(tenant), id, mediatorId));
  }

  @PostMapping("/{id}/settlement")
  public ResponseEntity<DisputeResponse> propose(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @Valid @RequestBody ProposeSettlementRequest request
  ) {
    return ResponseEntity.ok(service.propose(TenantContext.resolve(tenant), id, request));
  }

  @PostMapping("/{id}/settlement/accept")
  public ResponseEntity<DisputeResponse> acceptSettlement(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam String party
  ) {
    return ResponseEntity.ok(service.acceptSettlement(TenantContext.resolve(tenant), id, party));
  }

  @PostMapping("/{id}/settlement/reject")
  public ResponseEntity<DisputeResponse> rejectSettlement(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam String party, @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.rejectSettlement(TenantContext.resolve(tenant), id, party, reason));
  }

  // --- Tier 3: arbitration ---
  @PostMapping("/{id}/escalate/arbitration")
  public ResponseEntity<DisputeResponse> toArbitration(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam(required = false) UUID arbitratorId
  ) {
    return ResponseEntity.ok(service.escalateToArbitration(TenantContext.resolve(tenant), id, arbitratorId));
  }

  @PostMapping("/{id}/award")
  public ResponseEntity<DisputeResponse> award(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @Valid @RequestBody AwardRequest request
  ) {
    return ResponseEntity.ok(service.issueAward(TenantContext.resolve(tenant), id, request));
  }

  @PostMapping("/{id}/withdraw")
  public ResponseEntity<DisputeResponse> withdraw(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant, @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.withdraw(TenantContext.resolve(tenant), id, reason));
  }
}
