package com.baalvion.aml.service;

import com.baalvion.aml.domain.AmlAlert;
import com.baalvion.aml.domain.AmlAlert.AlertStatus;
import com.baalvion.aml.domain.AmlAlert.RiskGrade;
import com.baalvion.aml.dto.AlertResponse;
import com.baalvion.aml.dto.ScreenRequest;
import com.baalvion.aml.dto.ScreenResponse;
import com.baalvion.aml.exception.NotFoundException;
import com.baalvion.aml.provider.AmlScreeningProvider;
import com.baalvion.aml.provider.AmlScreeningProvider.ScreenInput;
import com.baalvion.aml.provider.AmlScreeningProvider.ScreenOutcome;
import com.baalvion.common.security.AuthContext;
import com.baalvion.aml.repository.AmlAlertRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Transaction-monitoring engine. {@link #screen} runs the configured rules provider over a
 * transaction; if any rule fires it persists an {@link AmlAlert} and emits {@code aml.alert.raised}.
 * Analysts then run the case workflow: investigate → clear (false positive) | escalate | file-SAR.
 * Escalation emits {@code aml.case.escalated}; SAR filing emits {@code aml.sar.filed}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AmlService {

  private final AmlAlertRepository alertRepository;
  private final AmlScreeningProvider provider;
  private final OutboxService outbox;
  private final ObjectMapper objectMapper;

  // --------------------------------------------------------------------------- screen

  public ScreenResponse screen(UUID tenantId, ScreenRequest req) {
    String idem = (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank())
      ? req.getIdempotencyKey() : null;
    if (idem != null) {
      var existing = alertRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
      if (existing.isPresent()) {
        log.info("Idempotent AML screen: key={} already raised alert for tenant={}", idem, tenantId);
        return toScreenResponse(existing.get(), true);
      }
    }

    ScreenOutcome outcome = provider.screen(new ScreenInput(
      req.getAmount(), req.getCurrency(), req.getCounterpartyCountry(),
      req.getDirection(), req.getRecentTxCount(), req.getRecentTxTotal()));

    boolean raised = !outcome.rules().isEmpty();
    if (!raised) {
      log.debug("AML screen clean: tenant={}, amount={} {}", tenantId, req.getAmount(), req.getCurrency());
      return ScreenResponse.builder()
        .alertRaised(false)
        .riskScore(outcome.riskScore())
        .riskGrade(outcome.grade())
        .triggeredRules(java.util.List.of())
        .build();
    }

    AmlAlert alert = AmlAlert.builder()
      .tenantId(tenantId)
      .idempotencyKey(idem != null ? idem : UUID.randomUUID().toString())
      .reference(generateReference(tenantId))
      .subjectId(req.getSubjectId()).subjectName(req.getSubjectName())
      .transactionId(req.getTransactionId())
      .direction(req.getDirection() != null ? req.getDirection().toUpperCase() : null)
      .amount(req.getAmount())
      .currency(req.getCurrency() != null ? req.getCurrency().toUpperCase() : null)
      .counterpartyCountry(req.getCounterpartyCountry() != null ? req.getCounterpartyCountry().toUpperCase() : null)
      .riskScore(outcome.riskScore())
      .riskGrade(RiskGrade.valueOf(outcome.grade()))
      .triggeredRules(writeJson(outcome.rules()))
      .status(AlertStatus.OPEN)
      .details(writeJson(req.getDetails()))
      .createdBy(AuthContext.currentUserId().orElse(null))
      .build();
    alert = alertRepository.save(alert);

    log.info("AML alert raised: id={}, ref={}, grade={}, score={}, rules={}, tenant={}",
      alert.getId(), alert.getReference(), alert.getRiskGrade(), alert.getRiskScore(),
      outcome.rules().size(), tenantId);
    outbox.enqueue(tenantId, "aml.alert.raised", alert.getId().toString(), AlertResponse.from(alert, objectMapper));
    return toScreenResponse(alert, true);
  }

  // --------------------------------------------------------------------------- case workflow

  public AlertResponse investigate(UUID tenantId, UUID id, String assignedTo) {
    AmlAlert a = load(tenantId, id);
    requireOpen(a);
    a.setStatus(AlertStatus.INVESTIGATING);
    if (assignedTo != null && !assignedTo.isBlank()) a.setAssignedTo(assignedTo);
    alertRepository.save(a);
    return AlertResponse.from(a, objectMapper);
  }

  /** Clear as a false positive — terminal, no SAR. */
  public AlertResponse clear(UUID tenantId, UUID id, String findings) {
    AmlAlert a = load(tenantId, id);
    requireActive(a);
    a.setStatus(AlertStatus.CLEARED);
    a.setFindings(findings);
    a.setResolvedAt(java.time.LocalDateTime.now());
    alertRepository.save(a);
    log.info("AML alert cleared (false positive): id={}, tenant={}", id, tenantId);
    return AlertResponse.from(a, objectMapper);
  }

  /** Escalate to the financial-crime team for SAR consideration. */
  public AlertResponse escalate(UUID tenantId, UUID id, String findings) {
    AmlAlert a = load(tenantId, id);
    requireActive(a);
    a.setStatus(AlertStatus.ESCALATED);
    if (findings != null) a.setFindings(findings);
    alertRepository.save(a);
    log.info("AML alert escalated: id={}, grade={}, tenant={}", id, a.getRiskGrade(), tenantId);
    outbox.enqueue(tenantId, "aml.case.escalated", id.toString(), AlertResponse.from(a, objectMapper));
    return AlertResponse.from(a, objectMapper);
  }

  /** File a Suspicious Activity Report — terminal, regulatory-reportable. */
  public AlertResponse fileSar(UUID tenantId, UUID id, String findings) {
    AmlAlert a = load(tenantId, id);
    requireActive(a);
    a.setStatus(AlertStatus.SAR_FILED);
    if (findings != null) a.setFindings(findings);
    a.setResolvedAt(java.time.LocalDateTime.now());
    alertRepository.save(a);
    log.info("AML SAR filed: id={}, ref={}, grade={}, tenant={}", id, a.getReference(), a.getRiskGrade(), tenantId);
    outbox.enqueue(tenantId, "aml.sar.filed", id.toString(), AlertResponse.from(a, objectMapper));
    return AlertResponse.from(a, objectMapper);
  }

  // --------------------------------------------------------------------------- reads

  @Transactional(readOnly = true)
  public AlertResponse get(UUID tenantId, UUID id) {
    return AlertResponse.from(load(tenantId, id), objectMapper);
  }

  @Transactional(readOnly = true)
  public Page<AlertResponse> list(UUID tenantId, String status, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<AmlAlert> result = (status != null)
      ? alertRepository.findByTenantIdAndStatus(tenantId, parseStatus(status), pageable)
      : alertRepository.findByTenantId(tenantId, pageable);
    return result.map(a -> AlertResponse.from(a, objectMapper));
  }

  // --------------------------------------------------------------------------- helpers

  private ScreenResponse toScreenResponse(AmlAlert a, boolean raised) {
    return ScreenResponse.builder()
      .alertRaised(raised)
      .riskScore(a.getRiskScore())
      .riskGrade(a.getRiskGrade() != null ? a.getRiskGrade().name() : null)
      .alert(AlertResponse.from(a, objectMapper))
      .build();
  }

  private void requireOpen(AmlAlert a) {
    if (a.getStatus() != AlertStatus.OPEN) {
      throw new IllegalStateException("Alert is not OPEN (was " + a.getStatus() + ")");
    }
  }

  private void requireActive(AmlAlert a) {
    if (a.getStatus() == AlertStatus.CLEARED || a.getStatus() == AlertStatus.SAR_FILED) {
      throw new IllegalStateException("Alert is already closed (" + a.getStatus() + ")");
    }
  }

  private AmlAlert load(UUID tenantId, UUID id) {
    return alertRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("AML alert not found: " + id));
  }

  private AlertStatus parseStatus(String value) {
    try {
      return AlertStatus.valueOf(value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid status: " + value);
    }
  }

  private String generateReference(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "AML-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!alertRepository.existsByTenantIdAndReference(tenantId, candidate)) return candidate;
    }
    throw new IllegalStateException("Unable to allocate a unique AML reference");
  }

  private String writeJson(Object value) {
    if (value == null) return "{}";
    try { return objectMapper.writeValueAsString(value); }
    catch (Exception e) { throw new IllegalStateException("Unable to serialize JSON field", e); }
  }
}
