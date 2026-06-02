package com.baalvion.payment.controller;

import com.baalvion.common.security.AbacPolicy;
import com.baalvion.common.security.AuthContext;
import com.baalvion.payment.dto.ApprovalResponse;
import com.baalvion.payment.dto.BulkPaymentRequest;
import com.baalvion.payment.dto.BulkPaymentResult;
import com.baalvion.payment.dto.FeeBreakdown;
import com.baalvion.payment.dto.InitiatePaymentRequest;
import com.baalvion.payment.dto.TransactionResponse;
import com.baalvion.payment.service.ApprovalService;
import com.baalvion.payment.service.BulkDisbursementService;
import com.baalvion.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

  private final PaymentService paymentService;
  private final BulkDisbursementService bulkDisbursementService;
  private final ApprovalService approvalService;
  private final AbacPolicy abac;

  /** Reversals at or above this amount require maker-checker approval (design §7.1). */
  @Value("${app.maker-checker.reversal-threshold:100000}")
  private BigDecimal reversalApprovalThreshold;

  public PaymentController(PaymentService paymentService, BulkDisbursementService bulkDisbursementService,
                           ApprovalService approvalService, AbacPolicy abac) {
    this.paymentService = paymentService;
    this.bulkDisbursementService = bulkDisbursementService;
    this.approvalService = approvalService;
    this.abac = abac;
  }

  @PostMapping("/initiate")
  public ResponseEntity<TransactionResponse> initiatePayment(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKeyHeader,
    @Valid @RequestBody InitiatePaymentRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    // Header takes precedence over a body key (design §3.1 X-Idempotency-Key).
    if (idempotencyKeyHeader != null && !idempotencyKeyHeader.isBlank()) {
      request.setIdempotencyKey(idempotencyKeyHeader);
    }
    log.info("POST /initiate: tenant={}, key={}, amount={}", tenantId, sanitizeForLog(request.getIdempotencyKey()), request.getAmount());

    TransactionResponse response = paymentService.initiatePayment(tenantId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/bulk")
  public ResponseEntity<List<BulkPaymentResult>> bulkDisburse(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @Valid @RequestBody BulkPaymentRequest request
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /bulk: tenant={}, items={}", tenantId, request.getItems().size());

    List<BulkPaymentResult> results = bulkDisbursementService.disburse(tenantId, request.getItems());
    return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(results);
  }

  @GetMapping("/{id}")
  public ResponseEntity<TransactionResponse> getPayment(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /{}: tenant={}, id={}", id, tenantId, id);

    TransactionResponse response = paymentService.getPayment(tenantId, id);
    return ResponseEntity.ok(response);
  }

  @GetMapping
  public ResponseEntity<Page<TransactionResponse>> listPayments(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestParam(required = false) String sourceAccountId,
    @RequestParam(required = false) String scheme,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("GET /: tenant={}, sourceAccountId={}, scheme={}, status={}, page={}, size={}",
      tenantId, sanitizeForLog(sourceAccountId), sanitizeForLog(scheme), sanitizeForLog(status), page, size);

    Page<TransactionResponse> responses = paymentService.listPayments(tenantId, sourceAccountId, scheme, status, page, size);
    return ResponseEntity.ok(responses);
  }

  @PostMapping("/{id}/complete")
  public ResponseEntity<TransactionResponse> completePayment(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /{}/complete: tenant={}", id, tenantId);

    TransactionResponse response = paymentService.completePayment(tenantId, id);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/{id}/fail")
  public ResponseEntity<TransactionResponse> failPayment(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @PathVariable UUID id,
    @RequestParam String reason
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    log.info("POST /{}/fail: tenant={}, reason={}", id, tenantId, sanitizeForLog(reason));

    TransactionResponse response = paymentService.failPayment(tenantId, id, reason);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/{id}/reverse")
  public ResponseEntity<?> reversePayment(
    @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
    @RequestHeader(value = "X-Actor", required = false) String actorHeader,
    @PathVariable UUID id,
    @RequestParam(required = false) String reasonCode
  ) {
    UUID tenantId = extractTenantId(tenantIdHeader);
    TransactionResponse txn = paymentService.getPayment(tenantId, id);

    // ABAC (§7.1): only the initiator or an ADMIN/OPERATOR may reverse a transaction.
    abac.requireOwnerOrRole(txn.getInitiatedBy(), "ADMIN", "OPERATOR");

    // Maker-checker (§7.1): high-value reversals are parked for a second pair of eyes.
    if (txn.getAmount() != null && txn.getAmount().compareTo(reversalApprovalThreshold) >= 0) {
      String maker = AuthContext.currentUserId().orElse(actorHeader != null && !actorHeader.isBlank() ? actorHeader : "anonymous");
      log.info("POST /{}/reverse: high-value (amount={}) → maker-checker approval, maker={}", id, txn.getAmount(), sanitizeForLog(maker));
      ApprovalResponse approval = approvalService.requestReversal(tenantId, id, reasonCode, maker);
      return ResponseEntity.status(HttpStatus.ACCEPTED).body(approval);
    }

    log.info("POST /{}/reverse: tenant={}, reasonCode={}", id, tenantId, sanitizeForLog(reasonCode));
    return ResponseEntity.ok(paymentService.reversePayment(tenantId, id, reasonCode));
  }

  @GetMapping("/{id}/fee-breakdown")
  public ResponseEntity<FeeBreakdown> getFeeBreakdown(
    @PathVariable UUID id,
    @RequestParam BigDecimal amount,
    @RequestParam String scheme
  ) {
    log.info("GET /{}/fee-breakdown: amount={}, scheme={}", id, amount, sanitizeForLog(scheme));

    FeeBreakdown breakdown = paymentService.getFeeBreakdown(amount, scheme);
    return ResponseEntity.ok(breakdown);
  }

  private UUID extractTenantId(String tenantIdHeader) {
    // Authenticated requests derive the tenant from the validated JWT; the header is ignored
    // when authenticated (no IDOR). Used only as a dev fallback when security is disabled.
    return com.baalvion.common.security.TenantContext.resolve(tenantIdHeader);
  }

  /** Strip CR/LF/tab from user-derived values before logging to prevent log injection. */
  private static String sanitizeForLog(String value) {
    return value == null ? null : value.replaceAll("[\r\n\t]", "_");
  }
}
