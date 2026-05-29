package com.baalvion.payment.service;

import com.baalvion.payment.dto.BulkPaymentResult;
import com.baalvion.payment.dto.InitiatePaymentRequest;
import com.baalvion.payment.dto.TransactionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Bulk disbursement (design §3.2 POST /payments/bulk).
 *
 * Deliberately NOT {@code @Transactional}: each item is initiated via the
 * {@link PaymentService} proxy so it runs in its OWN transaction. One bad item is
 * rejected and reported without rolling back the rest of the batch.
 */
@Slf4j
@Service
public class BulkDisbursementService {

  private final PaymentService paymentService;

  public BulkDisbursementService(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  public List<BulkPaymentResult> disburse(UUID tenantId, List<InitiatePaymentRequest> items) {
    List<BulkPaymentResult> results = new ArrayList<>(items.size());
    for (InitiatePaymentRequest item : items) {
      try {
        TransactionResponse r = paymentService.initiatePayment(tenantId, item);
        results.add(BulkPaymentResult.builder()
          .idempotencyKey(item.getIdempotencyKey())
          .status(r.getStatus())
          .transactionId(r.getId())
          .build());
      } catch (Exception e) {
        log.warn("Bulk disbursement item rejected: key={}: {}", item.getIdempotencyKey(), e.getMessage());
        results.add(BulkPaymentResult.builder()
          .idempotencyKey(item.getIdempotencyKey())
          .status("REJECTED")
          .error(e.getMessage())
          .build());
      }
    }
    log.info("Bulk disbursement processed: tenant={}, items={}", tenantId, items.size());
    return results;
  }
}
