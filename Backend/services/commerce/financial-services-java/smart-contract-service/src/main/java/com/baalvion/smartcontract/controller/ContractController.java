package com.baalvion.smartcontract.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.smartcontract.dto.*;
import com.baalvion.smartcontract.service.SmartContractService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** REST API for sale contracts + e-signature. All routes are tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
public class ContractController {

  private final SmartContractService service;

  @PostMapping
  public ResponseEntity<ContractResponse> create(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @Valid @RequestBody CreateContractRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank() && request.getIdempotencyKey() == null) {
      request.setIdempotencyKey(idempotencyKey);
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(TenantContext.resolve(tenant), request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ContractResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenant), id));
  }

  @GetMapping
  public ResponseEntity<Page<ContractResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenant), status, page, size));
  }

  @PostMapping("/{id}/send")
  public ResponseEntity<ContractResponse> send(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.sendForSignature(TenantContext.resolve(tenant), id));
  }

  @PostMapping("/{id}/signatures")
  public ResponseEntity<ContractResponse> sign(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam String party,
    @RequestParam(required = false) String signerName,
    HttpServletRequest http
  ) {
    return ResponseEntity.ok(service.recordSignature(TenantContext.resolve(tenant), id, party, signerName, http.getRemoteAddr()));
  }

  @PostMapping("/{id}/signatures/decline")
  public ResponseEntity<ContractResponse> decline(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam String party,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.declineSignature(TenantContext.resolve(tenant), id, party, reason));
  }

  @PostMapping("/{id}/void")
  public ResponseEntity<ContractResponse> voidContract(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id,
    @RequestParam(required = false) String reason
  ) {
    return ResponseEntity.ok(service.voidContract(TenantContext.resolve(tenant), id, reason));
  }

  @GetMapping("/{id}/signatures")
  public ResponseEntity<List<SignatureResponse>> signatures(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenant,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.getSignatures(TenantContext.resolve(tenant), id));
  }
}
