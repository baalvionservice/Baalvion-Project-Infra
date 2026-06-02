package com.baalvion.wallet.controller;

import com.baalvion.common.security.TenantContext;
import com.baalvion.wallet.domain.Wallet.WalletStatus;
import com.baalvion.wallet.dto.*;
import com.baalvion.wallet.service.WalletService;
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

/** REST API for the multi-currency wallet. All routes are tenant-scoped via the JWT. */
@Slf4j
@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {

  private final WalletService service;

  // --- lifecycle ---

  @PostMapping
  public ResponseEntity<WalletResponse> open(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @Valid @RequestBody OpenWalletRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.open(TenantContext.resolve(tenantHeader), request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<WalletResponse> get(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.get(TenantContext.resolve(tenantHeader), id));
  }

  @GetMapping("/by-holder/{holderId}")
  public ResponseEntity<WalletResponse> getByHolder(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID holderId
  ) {
    return ResponseEntity.ok(service.getByHolder(TenantContext.resolve(tenantHeader), holderId));
  }

  @GetMapping
  public ResponseEntity<Page<WalletResponse>> list(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return ResponseEntity.ok(service.list(TenantContext.resolve(tenantHeader), page, size));
  }

  @PostMapping("/{id}/freeze")
  public ResponseEntity<WalletResponse> freeze(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.setStatus(TenantContext.resolve(tenantHeader), id, WalletStatus.FROZEN));
  }

  @PostMapping("/{id}/unfreeze")
  public ResponseEntity<WalletResponse> unfreeze(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.setStatus(TenantContext.resolve(tenantHeader), id, WalletStatus.ACTIVE));
  }

  @PostMapping("/{id}/close")
  public ResponseEntity<WalletResponse> close(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.setStatus(TenantContext.resolve(tenantHeader), id, WalletStatus.CLOSED));
  }

  // --- balance movements ---

  @PostMapping("/{id}/credit")
  public ResponseEntity<WalletBalanceResponse> credit(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @PathVariable UUID id,
    @Valid @RequestBody MoneyRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank()) request.setIdempotencyKey(idempotencyKey);
    return ResponseEntity.ok(service.credit(TenantContext.resolve(tenantHeader), id, request));
  }

  @PostMapping("/{id}/debit")
  public ResponseEntity<WalletBalanceResponse> debit(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @PathVariable UUID id,
    @Valid @RequestBody MoneyRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank()) request.setIdempotencyKey(idempotencyKey);
    return ResponseEntity.ok(service.debit(TenantContext.resolve(tenantHeader), id, request));
  }

  @PostMapping("/{id}/transfers")
  public ResponseEntity<WalletResponse> transfer(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @PathVariable UUID id,
    @Valid @RequestBody TransferRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank()) request.setIdempotencyKey(idempotencyKey);
    return ResponseEntity.ok(service.transfer(TenantContext.resolve(tenantHeader), id, request));
  }

  @PostMapping("/{id}/conversions")
  public ResponseEntity<WalletResponse> convert(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
    @PathVariable UUID id,
    @Valid @RequestBody ConvertRequest request
  ) {
    if (idempotencyKey != null && !idempotencyKey.isBlank()) request.setIdempotencyKey(idempotencyKey);
    return ResponseEntity.ok(service.convert(TenantContext.resolve(tenantHeader), id, request));
  }

  // --- holds ---

  @PostMapping("/{id}/holds")
  public ResponseEntity<HoldResponse> hold(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @Valid @RequestBody HoldRequest request
  ) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.hold(TenantContext.resolve(tenantHeader), id, request));
  }

  @GetMapping("/{id}/holds")
  public ResponseEntity<List<HoldResponse>> listHolds(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(service.listHolds(TenantContext.resolve(tenantHeader), id));
  }

  @PostMapping("/holds/{holdId}/release")
  public ResponseEntity<HoldResponse> release(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID holdId
  ) {
    return ResponseEntity.ok(service.releaseHold(TenantContext.resolve(tenantHeader), holdId));
  }

  @PostMapping("/holds/{holdId}/capture")
  public ResponseEntity<HoldResponse> capture(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID holdId,
    @RequestBody(required = false) Map<String, String> body
  ) {
    String reference = body != null ? body.get("reference") : null;
    return ResponseEntity.ok(service.captureHold(TenantContext.resolve(tenantHeader), holdId, reference));
  }

  // --- statement ---

  @GetMapping("/{id}/statement")
  public ResponseEntity<Page<WalletEntryResponse>> statement(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantHeader,
    @PathVariable UUID id,
    @RequestParam(required = false) String currency,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "50") int size
  ) {
    return ResponseEntity.ok(service.statement(TenantContext.resolve(tenantHeader), id, currency, page, size));
  }
}
