package com.baalvion.escrow.service;

import com.baalvion.escrow.domain.Escrow;
import com.baalvion.escrow.domain.Escrow.EscrowStatus;
import com.baalvion.escrow.domain.Escrow.ReleaseCondition;
import com.baalvion.escrow.dto.CreateEscrowRequest;
import com.baalvion.escrow.dto.EscrowActionRequest;
import com.baalvion.escrow.dto.EscrowResponse;
import com.baalvion.escrow.repository.EscrowRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class EscrowService {

  private final EscrowRepository repository;
  private final KafkaTemplate<String, Object> kafkaTemplate;

  public EscrowService(EscrowRepository repository, KafkaTemplate<String, Object> kafkaTemplate) {
    this.repository = repository;
    this.kafkaTemplate = kafkaTemplate;
  }

  public EscrowResponse createHold(UUID tenantId, CreateEscrowRequest request) {
    var existing = repository.findByTenantAndRef(tenantId, request.getEscrowRef());
    if (existing.isPresent()) {
      log.info("Idempotent request: escrowRef={} already exists for tenant={}", sanitizeForLog(request.getEscrowRef()), tenantId);
      return mapToResponse(existing.get());
    }

    ReleaseCondition condition = ReleaseCondition.valueOf(request.getReleaseCondition());
    if (condition == ReleaseCondition.TIME_BASED && request.getReleaseAt() == null) {
      throw new IllegalArgumentException("releaseAt is required for TIME_BASED escrow");
    }

    var escrow = Escrow.builder()
      .tenantId(tenantId)
      .escrowRef(request.getEscrowRef())
      .sourceAccountId(request.getSourceAccountId())
      .beneficiaryAccountId(request.getBeneficiaryAccountId())
      .amount(request.getAmount())
      .currency(request.getCurrency())
      .status(EscrowStatus.HELD)
      .releaseCondition(condition)
      .releaseAt(request.getReleaseAt())
      .autoReleaseOnExpiry(request.getAutoReleaseOnExpiry() == null || request.getAutoReleaseOnExpiry())
      .metadata(request.getMetadata() != null ? request.getMetadata() : "{}")
      .build();

    var saved = repository.save(escrow);
    log.info("Escrow hold created: id={}, tenant={}, ref={}, amount={}, condition={}",
      saved.getId(), tenantId, sanitizeForLog(saved.getEscrowRef()), saved.getAmount(), condition);

    kafkaTemplate.send("escrow.hold.created", saved.getId().toString(), saved);
    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public EscrowResponse getEscrow(UUID tenantId, UUID escrowId) {
    return mapToResponse(loadEscrow(tenantId, escrowId));
  }

  @Transactional(readOnly = true)
  public Page<EscrowResponse> listEscrows(UUID tenantId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Escrow> escrows = status != null
      ? repository.findByTenantAndStatus(tenantId, EscrowStatus.valueOf(status), pageable)
      : repository.findByTenant(tenantId, pageable);
    return escrows.map(this::mapToResponse);
  }

  public EscrowResponse release(UUID tenantId, UUID escrowId, EscrowActionRequest action) {
    var escrow = loadEscrow(tenantId, escrowId);
    return applyRelease(escrow, action != null ? action.getActor() : null, false);
  }

  public EscrowResponse refund(UUID tenantId, UUID escrowId, EscrowActionRequest action) {
    var escrow = loadEscrow(tenantId, escrowId);
    return applyRefund(escrow, action != null ? action.getReason() : null, action != null ? action.getActor() : null, false);
  }

  public EscrowResponse dispute(UUID tenantId, UUID escrowId, EscrowActionRequest action) {
    var escrow = loadEscrow(tenantId, escrowId);
    if (escrow.getStatus() != EscrowStatus.HELD) {
      throw new IllegalStateException("Only HELD escrow can be disputed; current status=" + escrow.getStatus());
    }
    escrow.setStatus(EscrowStatus.DISPUTED);
    escrow.setDisputeReason(action != null ? action.getReason() : "Dispute raised");
    var saved = repository.save(escrow);
    log.info("Escrow disputed: id={}, tenant={}, reason={}", escrowId, tenantId, sanitizeForLog(saved.getDisputeReason()));
    kafkaTemplate.send("escrow.hold.disputed", saved.getId().toString(), saved);
    return mapToResponse(saved);
  }

  /**
   * Scheduled sweep that auto-resolves TIME_BASED holds past their release time.
   * Runs every 5 minutes. Each expired hold is released or refunded per its
   * {@code autoReleaseOnExpiry} flag.
   */
  @Scheduled(fixedDelayString = "${app.expiry-sweep-ms:300000}")
  public void sweepExpiredHolds() {
    List<Escrow> expired = repository.findExpiredHolds(
      EscrowStatus.HELD, ReleaseCondition.TIME_BASED, LocalDateTime.now());
    if (expired.isEmpty()) {
      return;
    }
    log.info("Escrow expiry sweep: {} hold(s) due", expired.size());
    for (Escrow escrow : expired) {
      try {
        if (escrow.isAutoReleaseOnExpiry()) {
          applyRelease(escrow, "system-expiry", true);
        } else {
          applyRefund(escrow, "Auto-refund on expiry", "system-expiry", true);
        }
      } catch (Exception e) {
        log.error("Failed to auto-resolve escrow {}: {}", escrow.getId(), e.getMessage());
      }
    }
  }

  private EscrowResponse applyRelease(Escrow escrow, String actor, boolean expiry) {
    if (escrow.getStatus() != EscrowStatus.HELD && escrow.getStatus() != EscrowStatus.DISPUTED) {
      throw new IllegalStateException("Escrow cannot be released from status " + escrow.getStatus());
    }
    escrow.setStatus(EscrowStatus.RELEASED);
    escrow.setReleasedAt(LocalDateTime.now());
    var saved = repository.save(escrow);
    log.info("Escrow released: id={}, tenant={}, beneficiary={}, actor={}, expiry={}",
      saved.getId(), saved.getTenantId(), saved.getBeneficiaryAccountId(), sanitizeForLog(actor), expiry);
    kafkaTemplate.send("escrow.hold.released", saved.getId().toString(), saved);
    return mapToResponse(saved);
  }

  private EscrowResponse applyRefund(Escrow escrow, String reason, String actor, boolean expiry) {
    if (escrow.getStatus() != EscrowStatus.HELD && escrow.getStatus() != EscrowStatus.DISPUTED) {
      throw new IllegalStateException("Escrow cannot be refunded from status " + escrow.getStatus());
    }
    escrow.setStatus(EscrowStatus.REFUNDED);
    escrow.setRefundedAt(LocalDateTime.now());
    if (reason != null) {
      escrow.setDisputeReason(reason);
    }
    var saved = repository.save(escrow);
    log.info("Escrow refunded: id={}, tenant={}, source={}, actor={}, expiry={}",
      saved.getId(), saved.getTenantId(), saved.getSourceAccountId(), sanitizeForLog(actor), expiry);
    kafkaTemplate.send("escrow.hold.refunded", saved.getId().toString(), saved);
    return mapToResponse(saved);
  }

  private Escrow loadEscrow(UUID tenantId, UUID escrowId) {
    return repository.findByIdAndTenant(escrowId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Escrow not found: " + escrowId));
  }

  /**
   * Strips CR/LF/tab from user-derived values before they reach the logs to
   * prevent log-injection / log-forging (CWE-117).
   */
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }

  private EscrowResponse mapToResponse(Escrow escrow) {
    return EscrowResponse.builder()
      .id(escrow.getId())
      .tenantId(escrow.getTenantId())
      .escrowRef(escrow.getEscrowRef())
      .sourceAccountId(escrow.getSourceAccountId())
      .beneficiaryAccountId(escrow.getBeneficiaryAccountId())
      .amount(escrow.getAmount())
      .currency(escrow.getCurrency())
      .status(escrow.getStatus().name())
      .releaseCondition(escrow.getReleaseCondition().name())
      .releaseAt(escrow.getReleaseAt())
      .autoReleaseOnExpiry(escrow.isAutoReleaseOnExpiry())
      .releasedAt(escrow.getReleasedAt())
      .refundedAt(escrow.getRefundedAt())
      .disputeReason(escrow.getDisputeReason())
      .ledgerJournalId(escrow.getLedgerJournalId())
      .metadata(escrow.getMetadata())
      .createdAt(escrow.getCreatedAt())
      .updatedAt(escrow.getUpdatedAt())
      .build();
  }
}
