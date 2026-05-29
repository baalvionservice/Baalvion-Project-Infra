package com.baalvion.ledger.kafka;

import com.baalvion.ledger.dto.EntryResponse;
import com.baalvion.ledger.dto.PostEntryRequest;
import com.baalvion.ledger.service.LedgerService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
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
 */
@Slf4j
@Component
public class PaymentInitiatedListener {

  private final LedgerService ledgerService;
  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;

  public PaymentInitiatedListener(LedgerService ledgerService, KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
    this.ledgerService = ledgerService;
    this.kafkaTemplate = kafkaTemplate;
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

      EntryResponse entry = ledgerService.postEntry(tenantId, request);
      log.info("Saga: journal posted for payment {} -> journal {}", transactionId, entry.getId());

      publish("payments.ledger.posted", transactionId.toString(), Map.of(
        "transactionId", transactionId,
        "tenantId", tenantId,
        "journalId", entry.getId(),
        "transactionRef", entry.getTransactionRef()
      ));
    } catch (IllegalArgumentException | IllegalStateException businessError) {
      // Expected, non-retryable: tell Payment to compensate (mark FAILED).
      log.warn("Saga: ledger posting rejected for payment {}: {}", transactionId, businessError.getMessage());
      Map<String, Object> failure = new HashMap<>();
      failure.put("transactionId", transactionId);
      failure.put("tenantId", tenantId);
      failure.put("reason", businessError.getMessage());
      publish("payments.ledger.failed", transactionId.toString(), failure);
    }
  }

  private void publish(String topic, String key, Map<String, Object> payload) {
    try {
      kafkaTemplate.send(topic, key, objectMapper.writeValueAsString(payload));
    } catch (Exception e) {
      log.error("Failed to publish {} for {}: {}", topic, key, e.getMessage());
    }
  }
}
