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
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
   * honoured ONLY when the request carries no principal at all — i.e. only when
   * app.security.enabled=false (local/dev, JWT enforcement off entirely), the same precedent
   * TenantContext.resolve already sets for X-Tenant-ID.
   *
   * <p>Checking {@link AuthContext#isAuthenticated()} alone is not enough to make it inert: that
   * is JWT-only, so a ROLE_INTERNAL principal (shared-secret server-to-server, see
   * InternalServiceAuthFilter) reads as "not authenticated" while still passing the filter chain's
   * {@code anyRequest().authenticated()}. Without the explicit principal check below, any holder of
   * the internal secret could name any holder id here and operate on their wallet.
   */
  private UUID requireCallerHolderId(String debugHolderId) {
    if (AuthContext.isAuthenticated()) {
      return AuthContext.currentUserId().map(WalletDepositController::parseUuidOrNull)
          .filter(Objects::nonNull)
          .orElseThrow(() -> new AccessDeniedException("Authenticated request carries no usable user id"));
    }
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && !(authentication instanceof AnonymousAuthenticationToken)) {
      // A non-JWT principal (e.g. ROLE_INTERNAL): it has no user identity of its own, and these
      // /me endpoints are defined by the caller's identity. Refuse rather than let it pick one.
      // Anonymous is excluded deliberately — the permissive chain still runs Spring's anonymous
      // filter, so with security disabled the principal is an AnonymousAuthenticationToken rather
      // than null, and treating that as a real principal would kill the dev fallback below.
      throw new AccessDeniedException(
          "Caller has no user identity; /me wallet endpoints require an end-user JWT");
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
