package com.baalvion.risk.kafka;

import com.baalvion.risk.service.RiskService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Scores every initiated payment. Runs in its own consumer group, in parallel with the
 * ledger saga step — risk is advisory/monitoring (publishes a decision) rather than a
 * blocking gate. Failures retry then dead-letter (payments.transaction.initiated.DLT).
 */
@Slf4j
@Component
public class RiskListener {

  private final RiskService riskService;
  private final ObjectMapper objectMapper;

  public RiskListener(RiskService riskService, ObjectMapper objectMapper) {
    this.riskService = riskService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = "payments.transaction.initiated")
  public void onPaymentInitiated(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    riskService.assess(
      UUID.fromString(e.get("tenantId").asText()),
      UUID.fromString(e.get("id").asText()),
      UUID.fromString(e.get("sourceAccountId").asText()),
      new BigDecimal(e.get("amount").asText()),
      e.get("currency").asText(),
      e.hasNonNull("paymentScheme") ? e.get("paymentScheme").asText() : null
    );
  }
}
