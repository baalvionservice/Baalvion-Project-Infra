package com.baalvion.account.controller;

import com.baalvion.account.dto.AccountLimitsResponse;
import com.baalvion.account.dto.AccountResponse;
import com.baalvion.account.dto.BalanceUpdateRequest;
import com.baalvion.account.dto.CreateAccountRequest;
import com.baalvion.account.dto.UpdateKycRequest;
import com.baalvion.account.service.AccountService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

  private final AccountService accountService;

  public AccountController(AccountService accountService) {
    this.accountService = accountService;
  }

  @PostMapping
  public ResponseEntity<AccountResponse> createAccount(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody CreateAccountRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /accounts: tenant={}, type={}", sanitizeForLog(String.valueOf(tenantId)), sanitizeForLog(request.getAccountType()));

    AccountResponse response = accountService.createAccount(tenantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<AccountResponse> getAccount(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /accounts/{}: tenant={}", id, tenantId);

    return ResponseEntity.ok(accountService.getAccount(tenantId, id));
  }

  @GetMapping
  public ResponseEntity<Page<AccountResponse>> listAccounts(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String type,
    @RequestParam(required = false) String kycStatus,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /accounts: tenant={}, type={}, kycStatus={}, page={}, size={}", tenantId, sanitizeForLog(type), sanitizeForLog(kycStatus), page, size);

    return ResponseEntity.ok(accountService.listAccounts(tenantId, type, kycStatus, page, size));
  }

  @PatchMapping("/{id}/kyc")
  public ResponseEntity<AccountResponse> updateKyc(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @Valid @RequestBody UpdateKycRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("PATCH /accounts/{}/kyc: tenant={}, target={}", id, tenantId, sanitizeForLog(request.getKycStatus()));

    return ResponseEntity.ok(accountService.updateKyc(tenantId, id, request));
  }

  @GetMapping("/{id}/limits")
  public ResponseEntity<AccountLimitsResponse> getLimits(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /accounts/{}/limits: tenant={}", id, tenantId);

    return ResponseEntity.ok(accountService.getLimits(tenantId, id));
  }

  @PostMapping("/{id}/credit")
  public ResponseEntity<AccountResponse> credit(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @Valid @RequestBody BalanceUpdateRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /accounts/{}/credit: tenant={}, amount={}", id, tenantId, request.getAmount());

    return ResponseEntity.ok(accountService.credit(tenantId, id, request.getAmount(), request.getReference()));
  }

  @PostMapping("/{id}/debit")
  public ResponseEntity<AccountResponse> debit(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @Valid @RequestBody BalanceUpdateRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /accounts/{}/debit: tenant={}, amount={}", id, tenantId, request.getAmount());

    return ResponseEntity.ok(accountService.debit(tenantId, id, request.getAmount(), request.getReference()));
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }

  // Neutralizes CR/LF/tab in user-derived values before logging to prevent log injection.
  private static String sanitizeForLog(String value) {
    if (value == null) {
      return null;
    }
    return value.replaceAll("[\r\n\t]", "_");
  }
}
