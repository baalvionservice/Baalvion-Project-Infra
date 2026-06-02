package com.baalvion.payment.service;

import com.baalvion.payment.domain.ApprovalRequest;
import com.baalvion.payment.domain.ApprovalRequest.Status;
import com.baalvion.payment.dto.ApprovalResponse;
import com.baalvion.payment.repository.ApprovalRequestRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Maker-checker workflow (design §7.1). High-value operations are parked as PENDING approval
 * requests by a maker and executed only when a different checker approves.
 *
 * Depends on {@link PaymentService} to execute the underlying operation on approval — the
 * dependency is one-directional (Payment does not depend on this service), so there is no cycle.
 */
@Slf4j
@Service
@Transactional
public class ApprovalService {

  public static final String OP_PAYMENT_REVERSAL = "PAYMENT_REVERSAL";

  private final ApprovalRequestRepository repository;
  private final PaymentService paymentService;
  private final ObjectMapper objectMapper;

  public ApprovalService(ApprovalRequestRepository repository, PaymentService paymentService, ObjectMapper objectMapper) {
    this.repository = repository;
    this.paymentService = paymentService;
    this.objectMapper = objectMapper;
  }

  /** Raise a 4-eyes request to reverse a (high-value) payment. */
  public ApprovalResponse requestReversal(UUID tenantId, UUID transactionId, String reasonCode, String makerId) {
    Map<String, Object> payload = new HashMap<>();
    payload.put("reasonCode", reasonCode);
    var request = ApprovalRequest.builder()
      .tenantId(tenantId)
      .operation(OP_PAYMENT_REVERSAL)
      .resourceId(transactionId)
      .payload(serialize(payload))
      .status(Status.PENDING)
      .makerId(makerId != null ? makerId : "unknown")
      .build();
    var saved = repository.save(request);
    log.info("Maker-checker: reversal approval {} raised by {} for txn {}", saved.getId(), sanitizeForLog(makerId), sanitizeForLog(String.valueOf(transactionId)));
    return mapToResponse(saved);
  }

  /** Checker approves; the operation executes here. Checker must differ from maker. */
  public ApprovalResponse approve(UUID tenantId, UUID approvalId, String checkerId) {
    var approval = load(tenantId, approvalId);
    if (approval.getStatus() != Status.PENDING) {
      throw new IllegalStateException("Approval already " + approval.getStatus());
    }
    if (checkerId == null || checkerId.equals(approval.getMakerId())) {
      throw new IllegalStateException("Four-eyes violation: the checker must differ from the maker");
    }

    execute(approval);

    approval.setStatus(Status.APPROVED);
    approval.setCheckerId(checkerId);
    approval.setDecidedAt(LocalDateTime.now());
    var saved = repository.save(approval);
    log.info("Maker-checker: approval {} approved by {} (op={})", sanitizeForLog(String.valueOf(approvalId)), sanitizeForLog(checkerId), approval.getOperation());
    return mapToResponse(saved);
  }

  public ApprovalResponse reject(UUID tenantId, UUID approvalId, String checkerId, String reason) {
    var approval = load(tenantId, approvalId);
    if (approval.getStatus() != Status.PENDING) {
      throw new IllegalStateException("Approval already " + approval.getStatus());
    }
    approval.setStatus(Status.REJECTED);
    approval.setCheckerId(checkerId);
    approval.setDecisionReason(reason);
    approval.setDecidedAt(LocalDateTime.now());
    var saved = repository.save(approval);
    log.info("Maker-checker: approval {} rejected by {}", approvalId, sanitizeForLog(checkerId));
    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public ApprovalResponse get(UUID tenantId, UUID approvalId) {
    return mapToResponse(load(tenantId, approvalId));
  }

  @Transactional(readOnly = true)
  public Page<ApprovalResponse> list(UUID tenantId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ApprovalRequest> result = status != null
      ? repository.findByTenantAndStatus(tenantId, Status.valueOf(status), pageable)
      : repository.findByTenant(tenantId, pageable);
    return result.map(this::mapToResponse);
  }

  private void execute(ApprovalRequest approval) {
    if (OP_PAYMENT_REVERSAL.equals(approval.getOperation())) {
      String reasonCode = readReason(approval.getPayload());
      paymentService.reversePayment(approval.getTenantId(), approval.getResourceId(), reasonCode);
    } else {
      throw new IllegalStateException("Unsupported approval operation: " + approval.getOperation());
    }
  }

  private String readReason(String payloadJson) {
    try {
      JsonNode node = objectMapper.readTree(payloadJson);
      return node.hasNonNull("reasonCode") ? node.get("reasonCode").asText() : null;
    } catch (Exception e) {
      return null;
    }
  }

  /** Neutralize CR/LF/tab so user-derived values cannot forge or split log lines (log injection). */
  private String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }

  private ApprovalRequest load(UUID tenantId, UUID id) {
    return repository.findByIdAndTenant(id, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Approval request not found: " + id));
  }

  private String serialize(Map<String, Object> payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (Exception e) {
      return "{}";
    }
  }

  private ApprovalResponse mapToResponse(ApprovalRequest a) {
    return ApprovalResponse.builder()
      .id(a.getId())
      .tenantId(a.getTenantId())
      .operation(a.getOperation())
      .resourceId(a.getResourceId())
      .payload(a.getPayload())
      .status(a.getStatus().name())
      .makerId(a.getMakerId())
      .checkerId(a.getCheckerId())
      .decisionReason(a.getDecisionReason())
      .createdAt(a.getCreatedAt())
      .decidedAt(a.getDecidedAt())
      .build();
  }

  // Neutralizes CR/LF/tab in user-derived values before logging (prevents log injection).
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
