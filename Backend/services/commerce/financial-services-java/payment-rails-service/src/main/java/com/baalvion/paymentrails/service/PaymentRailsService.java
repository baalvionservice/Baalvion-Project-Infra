package com.baalvion.paymentrails.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.paymentrails.domain.PaymentInstruction;
import com.baalvion.paymentrails.domain.PaymentInstruction.Direction;
import com.baalvion.paymentrails.domain.PaymentInstruction.PaymentStatus;
import com.baalvion.paymentrails.domain.PaymentInstruction.Rail;
import com.baalvion.paymentrails.domain.PaymentInstruction.Urgency;
import com.baalvion.paymentrails.dto.*;
import com.baalvion.paymentrails.exception.NotFoundException;
import com.baalvion.paymentrails.provider.PaymentRailProvider;
import com.baalvion.paymentrails.repository.PaymentInstructionRepository;
import com.baalvion.paymentrails.routing.RailRoutingEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Routes and settles payment instructions: validate → choose rail (routing engine) → submit
 * (rail provider) → track to SETTLED/FAILED, emitting outbox events for the ledger and settlement
 * services at each transition.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentRailsService {

  private static final int MONEY_SCALE = 4;

  private final PaymentInstructionRepository repository;
  private final RailRoutingEngine router;
  private final PaymentRailProvider railProvider;

  private final OutboxService outbox;

  // --------------------------------------------------------------------------- initiate

  public PaymentResponse initiate(UUID tenantId, InitiatePaymentRequest req) {
    String idem = (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank())
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();
    var existing = repository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      log.info("Idempotent payment initiate: key={} exists for tenant={}", idem, tenantId);
      return PaymentResponse.from(existing.get());
    }

    validateCurrency(req.getCurrency());
    BigDecimal amount = req.getAmount().setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    PaymentInstruction p = PaymentInstruction.builder()
      .tenantId(tenantId)
      .idempotencyKey(idem)
      .reference(generateReference(tenantId))
      .direction(req.getDirection() != null ? parseEnum(Direction.class, req.getDirection(), "direction") : Direction.OUTBOUND)
      .debtorName(req.getDebtorName()).debtorAccount(req.getDebtorAccount()).debtorCountry(upper(req.getDebtorCountry()))
      .creditorName(req.getCreditorName()).creditorAccount(req.getCreditorAccount())
      .creditorBic(req.getCreditorBic()).creditorRouting(req.getCreditorRouting())
      .creditorCountry(req.getCreditorCountry().toUpperCase())
      .amount(amount).currency(req.getCurrency().toUpperCase()).purpose(req.getPurpose())
      .urgency(req.getUrgency() != null ? parseEnum(Urgency.class, req.getUrgency(), "urgency") : Urgency.STANDARD)
      .requestedRail(req.getRequestedRail() != null ? parseEnum(Rail.class, req.getRequestedRail(), "requestedRail") : null)
      .status(PaymentStatus.INITIATED)
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .build();

    // Route.
    RailRoutingEngine.RoutingDecision decision = router.choose(p);
    p.setRail(decision.rail());
    p.setRoutingNote(decision.note());
    p.setStatus(PaymentStatus.ROUTED);
    repository.save(p);
    outbox.enqueue(tenantId, "paymentrails.payment.routed", p.getId().toString(), PaymentResponse.from(p));
    log.info("Payment routed: id={}, ref={}, {} {} → rail {} ({}), tenant={}",
      p.getId(), p.getReference(), amount, p.getCurrency(), decision.rail(), decision.note(), tenantId);

    // Submit to the rail.
    PaymentRailProvider.SubmitResult result = railProvider.submit(p);
    p.setProvider(railProvider.providerName());
    if (result.accepted()) {
      p.setRailRef(result.railRef());
      p.setFeeAmount(result.fee() != null ? result.fee() : BigDecimal.ZERO);
      p.setFeeCurrency(p.getCurrency());
      p.setStatus(PaymentStatus.SUBMITTED);
      p.setSubmittedAt(LocalDateTime.now());
      repository.save(p);
      outbox.enqueue(tenantId, "paymentrails.payment.submitted", p.getId().toString(), PaymentResponse.from(p));
    } else {
      p.setStatus(PaymentStatus.FAILED);
      p.setFailureReason(result.failureReason() != null ? result.failureReason() : "Rail rejected the instruction");
      repository.save(p);
      outbox.enqueue(tenantId, "paymentrails.payment.failed", p.getId().toString(), PaymentResponse.from(p));
    }
    return PaymentResponse.from(p);
  }

  @Transactional(readOnly = true)
  public PaymentResponse get(UUID tenantId, UUID id) {
    return PaymentResponse.from(load(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<PaymentResponse> list(UUID tenantId, String status, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<PaymentInstruction> result = (status != null)
      ? repository.findByTenantIdAndStatus(tenantId, parseEnum(PaymentStatus.class, status, "status"), pageable)
      : repository.findByTenantId(tenantId, pageable);
    return result.map(PaymentResponse::from);
  }

  // --------------------------------------------------------------------------- settlement / status

  /** Marks a submitted payment settled (typically driven by a rail/PSP confirmation callback). */
  public PaymentResponse settle(UUID tenantId, UUID id) {
    PaymentInstruction p = load(tenantId, id);
    if (p.getStatus() != PaymentStatus.SUBMITTED) {
      throw new IllegalStateException("Only a SUBMITTED payment can be settled (was " + p.getStatus() + ")");
    }
    p.setStatus(PaymentStatus.SETTLED);
    p.setSettledAt(LocalDateTime.now());
    repository.save(p);
    log.info("Payment settled: id={}, rail={}, ref={}, tenant={}", id, p.getRail(), p.getRailRef(), tenantId);
    outbox.enqueue(tenantId, "paymentrails.payment.settled", id.toString(), PaymentResponse.from(p));
    return PaymentResponse.from(p);
  }

  public PaymentResponse fail(UUID tenantId, UUID id, String reason, boolean returned) {
    PaymentInstruction p = load(tenantId, id);
    if (p.getStatus() == PaymentStatus.SETTLED || p.getStatus() == PaymentStatus.CANCELLED) {
      throw new IllegalStateException("Payment is terminal (" + p.getStatus() + ")");
    }
    p.setStatus(returned ? PaymentStatus.RETURNED : PaymentStatus.FAILED);
    p.setFailureReason(reason);
    repository.save(p);
    outbox.enqueue(tenantId, "paymentrails.payment.failed", id.toString(), PaymentResponse.from(p));
    return PaymentResponse.from(p);
  }

  public PaymentResponse cancel(UUID tenantId, UUID id, String reason) {
    PaymentInstruction p = load(tenantId, id);
    if (p.getStatus() != PaymentStatus.INITIATED && p.getStatus() != PaymentStatus.ROUTED) {
      throw new IllegalStateException("Only an un-submitted payment can be cancelled (was " + p.getStatus() + ")");
    }
    p.setStatus(PaymentStatus.CANCELLED);
    p.setFailureReason(reason);
    repository.save(p);
    return PaymentResponse.from(p);
  }

  // --------------------------------------------------------------------------- helpers

  private PaymentInstruction load(UUID tenantId, UUID id) {
    return repository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Payment instruction not found: " + id));
  }

  private String generateReference(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "PR-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!repository.existsByTenantIdAndReference(tenantId, candidate)) return candidate;
    }
    throw new IllegalStateException("Unable to allocate a unique payment reference");
  }

  private String upper(String s) { return s != null ? s.toUpperCase() : null; }

  private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
    try {
      return Enum.valueOf(type, value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid " + field + ": " + value);
    }
  }

  private void validateCurrency(String currency) {
    if (currency == null || currency.trim().length() != 3) {
      throw new IllegalArgumentException("currency must be a 3-letter ISO 4217 code");
    }
  }
}
