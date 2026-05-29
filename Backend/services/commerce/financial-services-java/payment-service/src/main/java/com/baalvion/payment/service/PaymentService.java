package com.baalvion.payment.service;

import com.baalvion.payment.domain.Transaction;
import com.baalvion.payment.domain.Transaction.PaymentScheme;
import com.baalvion.payment.domain.Transaction.TransactionStatus;
import com.baalvion.payment.dto.InitiatePaymentRequest;
import com.baalvion.payment.dto.TransactionResponse;
import com.baalvion.payment.dto.FeeBreakdown;
import com.baalvion.payment.repository.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class PaymentService {

  private final TransactionRepository repository;
  private final FeeEngine feeEngine;
  private final IdempotencyService idempotencyService;
  private final OutboxService outboxService;
  private final SchemeRouter schemeRouter;

  /** Reversals are only permitted within this window of the original transaction (§5.2). 0 = unlimited. */
  @Value("${app.reversal-window-hours:24}")
  private long reversalWindowHours;

  public PaymentService(
    TransactionRepository repository,
    FeeEngine feeEngine,
    IdempotencyService idempotencyService,
    OutboxService outboxService,
    SchemeRouter schemeRouter
  ) {
    this.repository = repository;
    this.feeEngine = feeEngine;
    this.idempotencyService = idempotencyService;
    this.outboxService = outboxService;
    this.schemeRouter = schemeRouter;
  }

  public TransactionResponse initiatePayment(UUID tenantId, InitiatePaymentRequest request) {
    var existing = repository.findByTenantAndIdempotencyKey(tenantId, request.getIdempotencyKey());
    if (existing.isPresent()) {
      log.info("Idempotent request: key={} already exists for tenant={}", request.getIdempotencyKey(), tenantId);
      return mapToResponse(existing.get());
    }

    PaymentScheme scheme = PaymentScheme.valueOf(request.getPaymentScheme());
    feeEngine.validateAmount(request.getAmount());

    LocalDate today = LocalDate.now(ZoneId.of("UTC"));
    LocalDateTime startOfDay = today.atStartOfDay();
    BigDecimal dailyOutflows = repository.sumDailyOutflows(tenantId, request.getSourceAccountId(), startOfDay);
    feeEngine.validateDailyLimit(dailyOutflows, request.getAmount());

    FeeBreakdown fees = feeEngine.calculateFees(request.getAmount(), scheme);

    // Route to the downstream scheme (resilience-protected; degrades to deferred routing).
    String schemeRef = schemeRouter.route(new com.baalvion.payment.scheme.SchemeRequest(
      scheme, request.getAmount(), request.getCurrency(),
      request.getSourceAccountId(), request.getDestinationAccountId(), request.getIdempotencyKey()));

    var transaction = Transaction.builder()
      .tenantId(tenantId)
      .idempotencyKey(request.getIdempotencyKey())
      .sourceAccountId(request.getSourceAccountId())
      .destinationAccountId(request.getDestinationAccountId())
      .amount(request.getAmount())
      .fee(fees.getTotalFee())
      .vat(fees.getVat())
      .currency(request.getCurrency())
      .paymentScheme(scheme)
      .status(TransactionStatus.INITIATED)
      .schemeRef(schemeRef)
      .initiatedBy(com.baalvion.common.security.AuthContext.currentUserId().orElse(null))
      .metadata(request.getMetadata() != null ? request.getMetadata() : "{}")
      .build();

    var saved = repository.save(transaction);
    log.info("Payment initiated: id={}, tenant={}, key={}, amount={}, scheme={}",
      saved.getId(), tenantId, request.getIdempotencyKey(), request.getAmount(), scheme);

    outboxService.enqueue(saved.getTenantId(), "payments.transaction.initiated", saved.getId().toString(), mapToResponse(saved));

    return mapToResponse(saved);
  }

  public TransactionResponse getPayment(UUID tenantId, UUID transactionId) {
    var transaction = repository.findByIdAndTenant(transactionId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));
    return mapToResponse(transaction);
  }

  public Page<TransactionResponse> listPayments(UUID tenantId, String sourceAccountId, String scheme, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Transaction> transactions;

    if (sourceAccountId != null) {
      UUID accId = UUID.fromString(sourceAccountId);
      transactions = repository.findByTenantAndSourceAccount(tenantId, accId, pageable);
    } else if (scheme != null) {
      transactions = repository.findByTenantAndScheme(tenantId, PaymentScheme.valueOf(scheme), pageable);
    } else if (status != null) {
      transactions = repository.findByTenantAndStatus(tenantId, TransactionStatus.valueOf(status), pageable);
    } else {
      transactions = repository.findByTenant(tenantId, pageable);
    }

    return transactions.map(this::mapToResponse);
  }

  public TransactionResponse completePayment(UUID tenantId, UUID transactionId) {
    var transaction = repository.findByIdAndTenant(transactionId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

    if (transaction.getStatus() != TransactionStatus.INITIATED) {
      throw new IllegalStateException("Payment already processed");
    }

    transaction.setStatus(TransactionStatus.COMPLETED);
    transaction.setUpdatedAt(LocalDateTime.now());
    var saved = repository.save(transaction);

    log.info("Payment completed: id={}, tenant={}", transactionId, tenantId);
    outboxService.enqueue(saved.getTenantId(), "payments.transaction.completed", saved.getId().toString(), mapToResponse(saved));

    return mapToResponse(saved);
  }

  public TransactionResponse failPayment(UUID tenantId, UUID transactionId, String reason) {
    var transaction = repository.findByIdAndTenant(transactionId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

    if (transaction.getStatus() != TransactionStatus.INITIATED) {
      throw new IllegalStateException("Payment already processed");
    }

    transaction.setStatus(TransactionStatus.FAILED);
    transaction.setFailureReason(reason);
    transaction.setUpdatedAt(LocalDateTime.now());
    var saved = repository.save(transaction);

    log.info("Payment failed: id={}, tenant={}, reason={}", transactionId, tenantId, reason);
    outboxService.enqueue(saved.getTenantId(), "payments.transaction.failed", saved.getId().toString(), mapToResponse(saved));

    return mapToResponse(saved);
  }

  public TransactionResponse reversePayment(UUID tenantId, UUID transactionId, String reasonCode) {
    var transaction = repository.findByIdAndTenant(transactionId, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

    if (transaction.getStatus() == TransactionStatus.REVERSED) {
      throw new IllegalStateException("Payment already reversed");
    }

    // Reversals are time-gated (§5.2): refuse once the window has elapsed.
    if (reversalWindowHours > 0 && transaction.getCreatedAt() != null
        && transaction.getCreatedAt().isBefore(LocalDateTime.now().minusHours(reversalWindowHours))) {
      throw new IllegalStateException("Reversal window of " + reversalWindowHours + "h has elapsed for this transaction");
    }

    transaction.setStatus(TransactionStatus.REVERSED);
    transaction.setFailureReason(reasonCode != null ? "REVERSAL: " + reasonCode : "REVERSAL");
    transaction.setUpdatedAt(LocalDateTime.now());
    var saved = repository.save(transaction);

    log.info("Payment reversed: id={}, tenant={}, reason={}", transactionId, tenantId, reasonCode);
    outboxService.enqueue(saved.getTenantId(), "payments.transaction.reversed", saved.getId().toString(), mapToResponse(saved));

    return mapToResponse(saved);
  }

  public FeeBreakdown getFeeBreakdown(BigDecimal amount, String scheme) {
    return feeEngine.calculateFees(amount, PaymentScheme.valueOf(scheme));
  }

  private TransactionResponse mapToResponse(Transaction transaction) {
    return TransactionResponse.builder()
      .id(transaction.getId())
      .tenantId(transaction.getTenantId())
      .idempotencyKey(transaction.getIdempotencyKey())
      .sourceAccountId(transaction.getSourceAccountId())
      .destinationAccountId(transaction.getDestinationAccountId())
      .amount(transaction.getAmount())
      .fee(transaction.getFee())
      .vat(transaction.getVat())
      .currency(transaction.getCurrency())
      .paymentScheme(transaction.getPaymentScheme().name())
      .status(transaction.getStatus().name())
      .ledgerJournalId(transaction.getLedgerJournalId())
      .schemeRef(transaction.getSchemeRef())
      .initiatedBy(transaction.getInitiatedBy())
      .metadata(transaction.getMetadata())
      .failureReason(transaction.getFailureReason())
      .createdAt(transaction.getCreatedAt())
      .updatedAt(transaction.getUpdatedAt())
      .build();
  }
}
