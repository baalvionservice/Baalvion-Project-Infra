package com.baalvion.ledger.kafka;

import com.baalvion.ledger.dto.EntryResponse;
import com.baalvion.ledger.dto.PostEntryRequest;
import com.baalvion.ledger.service.LedgerService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Saga step: when the Payment service publishes {@code payments.transaction.initiated},
 * post the corresponding double-entry journal (debit source, credit destination) and
 * report the outcome back to Payment:
 *   - success  -> {@code payments.ledger.posted}  ({transactionId, journalId, ...})
 *   - business failure (bad/duplicate data) -> {@code payments.ledger.failed} (terminal, no retry)
 *
 * Transient/infrastructure exceptions propagate so the container's error handler retries
 * (1s/5s/25s) and finally routes the record to {@code payments.transaction.initiated.DLT}.
 *
 * <p>Both saga replies are written to the transactional outbox (NOT fire-and-forget
 * {@code kafkaTemplate.send}), so a broker outage at reply time can no longer drop the reply and
 * stall the saga forever: the success reply commits atomically with the journal entry, and the
 * retrying relay ({@code LedgerOutboxRelay}) guarantees delivery.
 */
@Slf4j
@Component
public class PaymentInitiatedListener {

  private static final String TOPIC_POSTED = "payments.ledger.posted";
  private static final String TOPIC_FAILED = "payments.ledger.failed";

  private final LedgerService ledgerService;
  private final ObjectMapper objectMapper;

  public PaymentInitiatedListener(LedgerService ledgerService, ObjectMapper objectMapper) {
    this.ledgerService = ledgerService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = "payments.transaction.initiated")
  public void onPaymentInitiated(String message) throws Exception {
    JsonNode event = objectMapper.readTree(message);

    UUID transactionId = UUID.fromString(event.get("id").asText());
    UUID tenantId = UUID.fromString(event.get("tenantId").asText());

    try {
      PostEntryRequest request = PostEntryRequest.builder()
        .transactionRef(transactionId.toString())
        .debitAccountId(UUID.fromString(event.get("sourceAccountId").asText()))
        .creditAccountId(UUID.fromString(event.get("destinationAccountId").asText()))
        .amount(new BigDecimal(event.get("amount").asText()))
        .currency(event.get("currency").asText())
        .entryType("PAYMENT")
        .description("Payment " + transactionId)
        .build();

      // Posts the journal AND enqueues the success reply to the outbox in ONE tx (atomic, retried).
      EntryResponse entry = ledgerService.postPaymentSaga(tenantId, transactionId, request, TOPIC_POSTED);
      log.info("Saga: journal posted for payment {} -> journal {}", transactionId, entry.getId());
    } catch (IllegalArgumentException | IllegalStateException businessError) {
      // Expected, non-retryable: tell Payment to compensate (mark FAILED). Routed through the outbox
      // (its own short tx via the service's @Transactional) so the failure reply is never dropped.
      log.warn("Saga: ledger posting rejected for payment {}: {}", transactionId, businessError.getMessage());
      Map<String, Object> failure = new LinkedHashMap<>();
      failure.put("transactionId", transactionId);
      failure.put("tenantId", tenantId);
      failure.put("reason", businessError.getMessage());
      ledgerService.enqueueEvent(tenantId, transactionId, TOPIC_FAILED, transactionId.toString(), failure);
    }
  }
}
