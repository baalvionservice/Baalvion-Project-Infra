package com.baalvion.payment.kafka;

import com.baalvion.payment.service.PaymentService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Saga continuation on the Payment side. Reacts to the Ledger's outcome:
 *   - {@code payments.ledger.posted}  -> complete the payment (emits payments.transaction.completed)
 *   - {@code payments.ledger.failed}  -> compensate: fail the payment (emits payments.transaction.failed)
 *
 * Already-processed payments are treated as a no-op (idempotent on redelivery) rather
 * than re-thrown, so duplicate events don't churn into the DLT.
 *
 * <p>Gated behind {@code app.kafka.enabled} (default true): when Kafka is disabled this listener is
 * not registered, so no consumer container starts and no broker connection is attempted.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class PaymentSagaListener {

  private final PaymentService paymentService;
  private final ObjectMapper objectMapper;

  public PaymentSagaListener(PaymentService paymentService, ObjectMapper objectMapper) {
    this.paymentService = paymentService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = "payments.ledger.posted")
  public void onLedgerPosted(String message) throws Exception {
    JsonNode event = objectMapper.readTree(message);
    UUID tenantId = UUID.fromString(event.get("tenantId").asText());
    UUID transactionId = UUID.fromString(event.get("transactionId").asText());
    try {
      paymentService.completePayment(tenantId, transactionId);
      log.info("Saga: payment {} completed after ledger posting", transactionId);
    } catch (IllegalStateException | IllegalArgumentException terminal) {
      log.warn("Saga: skipping complete for payment {} ({})", transactionId, terminal.getMessage());
    }
  }

  @KafkaListener(topics = "payments.ledger.failed")
  public void onLedgerFailed(String message) throws Exception {
    JsonNode event = objectMapper.readTree(message);
    UUID tenantId = UUID.fromString(event.get("tenantId").asText());
    UUID transactionId = UUID.fromString(event.get("transactionId").asText());
    String reason = event.hasNonNull("reason") ? event.get("reason").asText() : "Ledger posting failed";
    try {
      paymentService.failPayment(tenantId, transactionId, reason);
      log.info("Saga: payment {} failed (compensation) after ledger rejection", transactionId);
    } catch (IllegalStateException | IllegalArgumentException terminal) {
      log.warn("Saga: skipping fail for payment {} ({})", transactionId, terminal.getMessage());
    }
  }
}
