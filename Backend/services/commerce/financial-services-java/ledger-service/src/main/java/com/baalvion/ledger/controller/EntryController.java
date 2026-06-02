package com.baalvion.ledger.controller;

import com.baalvion.ledger.dto.AccountBalanceResponse;
import com.baalvion.ledger.dto.AccountStatementResponse;
import com.baalvion.ledger.dto.EntryResponse;
import com.baalvion.ledger.dto.PostEntryRequest;
import com.baalvion.ledger.service.LedgerService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/ledger")
public class EntryController {

  private final LedgerService ledgerService;

  public EntryController(LedgerService ledgerService) {
    this.ledgerService = ledgerService;
  }

  @PostMapping("/entries")
  public ResponseEntity<EntryResponse> postEntry(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody PostEntryRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /entries: tenant={}, ref={}", tenantId, sanitizeForLog(request.getTransactionRef()));

    EntryResponse response = ledgerService.postEntry(tenantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/entries/{id}")
  public ResponseEntity<EntryResponse> getEntry(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /entries/{}: tenant={}, id={}", id, tenantId, id);

    EntryResponse response = ledgerService.getEntry(tenantId, id);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/entries")
  public ResponseEntity<Page<EntryResponse>> listEntries(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String accountId,
    @RequestParam(required = false) String entryType,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /entries: tenant={}, accountId={}, entryType={}, status={}, page={}, size={}",
      tenantId, sanitizeForLog(accountId), sanitizeForLog(entryType), sanitizeForLog(status), page, size);

    Page<EntryResponse> responses = ledgerService.listEntries(tenantId, accountId, entryType, status, page, size);
    return ResponseEntity.ok(responses);
  }

  @PostMapping("/entries/{id}/reverse")
  public ResponseEntity<EntryResponse> reverseEntry(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /entries/{}/reverse: tenant={}", id, tenantId);

    EntryResponse response = ledgerService.reverseEntry(tenantId, id);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/accounts/{accountId}/statement")
  public ResponseEntity<AccountStatementResponse> getAccountStatement(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID accountId,
    @RequestParam(defaultValue = "100") int limit
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /accounts/{}/statement: tenant={}, limit={}", accountId, tenantId, limit);

    AccountStatementResponse response = ledgerService.getAccountStatement(tenantId, accountId, limit);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/accounts/{accountId}/balance")
  public ResponseEntity<AccountBalanceResponse> getAccountBalance(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID accountId
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /accounts/{}/balance: tenant={}", accountId, tenantId);

    AccountBalanceResponse response = ledgerService.getAccountBalance(tenantId, accountId);
    return ResponseEntity.ok(response);
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }

  // Strip CR/LF/tab from user-derived values before logging to prevent log injection (CRLF).
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
