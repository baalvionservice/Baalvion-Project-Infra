package com.baalvion.wallet.service;

import com.baalvion.common.security.TenantContext;
import com.baalvion.wallet.domain.WalletBillingWebhookEvent;
import com.baalvion.wallet.domain.WalletDeposit;
import com.baalvion.wallet.dto.*;
import com.baalvion.wallet.exception.NotFoundException;
import com.baalvion.wallet.repository.WalletBillingWebhookEventRepository;
import com.baalvion.wallet.repository.WalletDepositRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Wallet top-ups for market-underworld's B2C buyers. These buyers have no org/tenant claim on
 * their JWT (resolveTokenPayload's orgId is null for an account with no org membership), so
 * unlike the rest of the wallet API (which derives tenant from the JWT via TenantContext.resolve,
 * throwing when no tenant claim is present) every method here fixes the tenant to the single
 * platform-wide SYSTEM_TENANT sentinel and identifies the caller purely by holderId (their own
 * JWT subject) — consistent with how giftcard-service's server-to-server calls already land in
 * SYSTEM_TENANT today.
 *
 * <p>Deliberately NOT class-level {@code @Transactional} (unlike {@link WalletService}): each
 * step here (open/find the wallet, save a deposit row, call payment-service over HTTP, credit the
 * wallet) is its own independently-committing unit, exactly mirroring how giftcard-service's own
 * checkout()/fulfill() sequence is a series of separate writes rather than one wrapping
 * transaction. That also sidesteps a real Spring pitfall: {@link WalletService}'s methods are
 * themselves {@code @Transactional}, so if this class WERE transactional too, an exception thrown
 * by a nested call (e.g. {@code walletService.credit(...)} failing) would mark the shared,
 * REQUIRED-propagation transaction rollback-only — silently discarding this class's own
 * "record the failure" writes below even though they run after the exception is caught, and
 * surfacing as UnexpectedRollbackException instead. Not sharing a transaction avoids that trap.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WalletDepositService {

  private static final UUID TENANT = TenantContext.SYSTEM_TENANT;
  private static final String PROVIDER = "crypto";

  private final WalletService walletService;
  private final WalletDepositRepository depositRepository;
  private final WalletBillingWebhookEventRepository webhookEventRepository;
  private final PaymentServiceClient paymentServiceClient;
  private final ObjectMapper objectMapper;

  /**
   * open() is already idempotent per (tenant, holderId) — it returns the existing wallet (with
   * its real current balance) when one exists, or opens a fresh, genuinely-$0 one otherwise.
   * Deliberately NOT "try getByHolder, catch NotFoundException, then open()": a RuntimeException
   * crossing a nested @Transactional method boundary marks the whole (REQUIRED-propagation,
   * shared) transaction rollback-only in Spring even if the caller catches it — that would make
   * this fail with UnexpectedRollbackException on every brand-new user's first call.
   */
  public WalletResponse getMyWallet(UUID holderId) {
    OpenWalletRequest req = new OpenWalletRequest();
    req.setHolderId(holderId);
    req.setHolderType("USER");
    req.setDefaultCurrency("USD");
    return walletService.open(TENANT, req);
  }

  public DepositResponse initiate(UUID holderId, DepositRequest req) {
    WalletResponse wallet = getMyWallet(holderId);
    UUID walletId = wallet.getId();

    WalletDeposit deposit = depositRepository.save(WalletDeposit.builder()
        .tenantId(TENANT)
        .walletId(walletId)
        .holderId(holderId)
        .currency("USD")
        .amount(req.getAmount())
        .asset(req.getAsset())
        .status("pending")
        .build());

    PaymentServiceClient.InitiatedCharge charge;
    try {
      charge = paymentServiceClient.initiate(deposit.getId(), holderId, walletId, req.getAmount(), req.getAsset());
    } catch (Exception e) {
      log.error("Deposit charge creation failed for deposit {}: {}", deposit.getId(), e.getMessage());
      deposit.setStatus("failed");
      deposit.setFulfillmentError(e.getMessage());
      depositRepository.save(deposit);
      throw e;
    }

    deposit.setProviderChargeId(charge.chargeId);
    depositRepository.save(deposit);

    return DepositResponse.builder()
        .depositId(deposit.getId())
        .asset(charge.asset)
        .network(charge.network)
        .address(charge.address)
        .amountValue(charge.amountValue)
        .amountDisplay(charge.amountDisplay)
        .expiresAt(charge.expiresAt)
        .build();
  }

  @Transactional(readOnly = true)
  public DepositStatusResponse getStatus(UUID holderId, UUID depositId) {
    WalletDeposit deposit = depositRepository.findByIdAndTenantId(depositId, TENANT)
        .orElseThrow(() -> new NotFoundException("Deposit not found: " + depositId));
    if (!deposit.getHolderId().equals(holderId)) {
      throw new AccessDeniedException("Not authorized to view this deposit");
    }
    return DepositStatusResponse.from(deposit);
  }

  /**
   * Internal-secret-only callback from payment-service's BillingFulfillmentClient. Mirrors
   * giftcard-service's fulfill() idempotent-claim contract exactly: 200 always (applied or
   * duplicate), even when crediting fails after the claim — the charge WAS captured, so
   * payment-service must not be wedged into infinite retry; a credit failure here is flagged for
   * manual reconciliation instead.
   */
  public Map<String, Object> fulfill(BillingFulfillRequest req) {
    String eventId = req.getEventId();
    if (eventId == null || eventId.isBlank()) {
      throw new IllegalArgumentException("eventId is required");
    }
    Map<String, Object> metadata = req.getMetadata() != null ? req.getMetadata() : Map.of();
    UUID depositId = uuidFromMetadata(metadata, "depositId");
    UUID holderId = uuidFromMetadata(metadata, "holderId");
    if (depositId == null || holderId == null) {
      throw new IllegalArgumentException("metadata.depositId and metadata.holderId are required");
    }

    var existing = webhookEventRepository.findByProviderAndEventId(PROVIDER, eventId);
    if (existing.isPresent() && "applied".equals(existing.get().getStatus())) {
      return Map.of("applied", true, "duplicate", true);
    }
    WalletBillingWebhookEvent claim = existing.orElseGet(() -> webhookEventRepository.save(
        WalletBillingWebhookEvent.builder()
            .provider(PROVIDER)
            .eventId(eventId)
            .status("claimed")
            .payload(toJson(Map.of("metadata", metadata, "amountMinor", String.valueOf(req.getAmountMinor()), "currency", String.valueOf(req.getCurrency()))))
            .build()));

    WalletDeposit deposit = depositRepository.findByIdAndTenantId(depositId, TENANT)
        .orElseThrow(() -> new IllegalArgumentException("Deposit not found: " + depositId));
    if (!deposit.getHolderId().equals(holderId)) {
      throw new IllegalArgumentException("Deposit " + depositId + " does not belong to holder " + holderId);
    }

    try {
      MoneyRequest credit = new MoneyRequest();
      credit.setCurrency(deposit.getCurrency());
      credit.setAmount(deposit.getAmount());
      credit.setReference("deposit:" + depositId);
      credit.setIdempotencyKey("deposit:" + depositId);
      walletService.credit(TENANT, deposit.getWalletId(), credit);

      deposit.setStatus("credited");
      deposit.setCreditedAt(LocalDateTime.now());
      depositRepository.save(deposit);
      claim.setStatus("applied");
      webhookEventRepository.save(claim);
      log.info("Deposit credited: deposit={}, wallet={}, holder={}", depositId, deposit.getWalletId(), holderId);
      return Map.of("applied", true, "duplicate", false);
    } catch (Exception e) {
      log.error("Deposit credit failed after capture for deposit {} — flagging for manual reconciliation: {}",
          depositId, e.getMessage());
      deposit.setStatus("failed");
      deposit.setFulfillmentError(e.getMessage());
      depositRepository.save(deposit);
      claim.setStatus("applied");
      webhookEventRepository.save(claim);
      return Map.of("applied", true, "duplicate", false, "creditFailed", true);
    }
  }

  private UUID uuidFromMetadata(Map<String, Object> metadata, String key) {
    Object v = metadata.get(key);
    if (v == null) return null;
    try {
      return UUID.fromString(String.valueOf(v));
    } catch (IllegalArgumentException e) {
      return null;
    }
  }

  private String toJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception e) {
      return "{}";
    }
  }
}
