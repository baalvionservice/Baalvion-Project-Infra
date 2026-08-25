package com.baalvion.wallet.controller;

import com.baalvion.common.security.AuthContext;
import com.baalvion.wallet.dto.*;
import com.baalvion.wallet.service.WalletDepositService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Buyer-facing wallet endpoints for market-underworld. Deliberately separate from
 * {@link WalletController}'s by-holder/by-id surface: these always resolve "who" from the
 * caller's own JWT (never a client-supplied path/body value), sidestepping the ownership-trust
 * question entirely for the one part of the wallet API meant to be called directly by a browser.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletDepositController {

  private final WalletDepositService service;

  @GetMapping("/me")
  public ResponseEntity<WalletResponse> myWallet(
      @RequestHeader(value = "X-Debug-Holder-Id", required = false) String debugHolderId) {
    return ResponseEntity.ok(service.getMyWallet(requireCallerHolderId(debugHolderId)));
  }

  @PostMapping("/me/deposits")
  public ResponseEntity<DepositResponse> deposit(
      @RequestHeader(value = "X-Debug-Holder-Id", required = false) String debugHolderId,
      @Valid @RequestBody DepositRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(service.initiate(requireCallerHolderId(debugHolderId), request));
  }

  @GetMapping("/me/deposits/{depositId}")
  public ResponseEntity<DepositStatusResponse> depositStatus(
      @RequestHeader(value = "X-Debug-Holder-Id", required = false) String debugHolderId,
      @PathVariable UUID depositId) {
    return ResponseEntity.ok(service.getStatus(requireCallerHolderId(debugHolderId), depositId));
  }

  /** Called by payment-service's BillingFulfillmentClient — internal-secret only, never a browser. */
  @PostMapping("/billing/fulfill")
  @PreAuthorize("hasRole('INTERNAL')")
  public ResponseEntity<Map<String, Object>> fulfill(@RequestBody BillingFulfillRequest request) {
    return ResponseEntity.ok(service.fulfill(request));
  }

  /**
   * Who is calling, taken exclusively from the validated JWT. The X-Debug-Holder-Id fallback is
   * honoured ONLY when the request is unauthenticated — i.e. only when app.security.enabled=false
   * (local/dev, JWT enforcement off entirely), the same precedent TenantContext.resolve already
   * sets for X-Tenant-ID. It is inert in any real deployment: unauthenticated requests never reach
   * here once security is enabled (the filter chain rejects them first), and an authenticated
   * request always uses its own JWT subject regardless of what the header carries.
   */
  private UUID requireCallerHolderId(String debugHolderId) {
    if (AuthContext.isAuthenticated()) {
      return AuthContext.currentUserId().map(WalletDepositController::parseUuidOrNull)
          .filter(Objects::nonNull)
          .orElseThrow(() -> new AccessDeniedException("Authenticated request carries no usable user id"));
    }
    UUID debug = debugHolderId != null ? parseUuidOrNull(debugHolderId) : null;
    if (debug == null) {
      throw new AccessDeniedException(
          "No authenticated user and no X-Debug-Holder-Id header (dev-only fallback)");
    }
    return debug;
  }

  private static UUID parseUuidOrNull(String value) {
    try {
      return UUID.fromString(value);
    } catch (IllegalArgumentException e) {
      return null;
    }
  }
}
