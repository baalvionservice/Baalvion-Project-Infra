package com.baalvion.account.kafka;

import com.baalvion.account.service.AccountEventService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Keeps account balances in sync with the rest of the platform by reacting to events:
 *   - payments.transaction.completed -> debit source, credit destination
 *   - escrow.hold.created            -> debit source (funds move into escrow)
 *   - escrow.hold.released           -> credit beneficiary
 *   - escrow.hold.refunded           -> credit source
 *
 * Movements are de-duplicated via the inbox table, so redelivery never double-applies.
 * Genuine failures (missing account, insufficient funds) propagate to the error handler,
 * which retries then dead-letters for ops attention.
 */
@Slf4j
@Component
public class AccountBalanceListener {

  private final AccountEventService accountEventService;
  private final ObjectMapper objectMapper;

  public AccountBalanceListener(AccountEventService accountEventService, ObjectMapper objectMapper) {
    this.accountEventService = accountEventService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = "payments.transaction.completed")
  public void onPaymentCompleted(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    UUID id = UUID.fromString(e.get("id").asText());
    accountEventService.applyTransfer(
      "pay-completed:" + id,
      UUID.fromString(e.get("tenantId").asText()),
      UUID.fromString(e.get("sourceAccountId").asText()),
      UUID.fromString(e.get("destinationAccountId").asText()),
      new BigDecimal(e.get("amount").asText()),
      "payment " + id
    );
  }

  @KafkaListener(topics = "escrow.hold.created")
  public void onEscrowCreated(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    UUID id = UUID.fromString(e.get("id").asText());
    accountEventService.applyDebit(
      "escrow-created:" + id,
      UUID.fromString(e.get("tenantId").asText()),
      UUID.fromString(e.get("sourceAccountId").asText()),
      new BigDecimal(e.get("amount").asText()),
      "escrow hold " + id
    );
  }

  @KafkaListener(topics = "escrow.hold.released")
  public void onEscrowReleased(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    UUID id = UUID.fromString(e.get("id").asText());
    accountEventService.applyCredit(
      "escrow-released:" + id,
      UUID.fromString(e.get("tenantId").asText()),
      UUID.fromString(e.get("beneficiaryAccountId").asText()),
      new BigDecimal(e.get("amount").asText()),
      "escrow release " + id
    );
  }

  @KafkaListener(topics = "escrow.hold.refunded")
  public void onEscrowRefunded(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    UUID id = UUID.fromString(e.get("id").asText());
    accountEventService.applyCredit(
      "escrow-refunded:" + id,
      UUID.fromString(e.get("tenantId").asText()),
      UUID.fromString(e.get("sourceAccountId").asText()),
      new BigDecimal(e.get("amount").asText()),
      "escrow refund " + id
    );
  }
}
