package com.baalvion.ledger.kafka;

import com.baalvion.ledger.dto.PostEntryRequest;
import com.baalvion.ledger.service.LedgerService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Records escrow movements as proper double-entry journal postings (design §5.3), keeping the
 * ledger the single source of truth for balances.
 *
 *   hold.created  : debit source        / credit escrow-suspense   (funds leave the source)
 *   hold.released : debit escrow-suspense / credit beneficiary      (funds reach the beneficiary)
 *   hold.refunded : debit escrow-suspense / credit source           (funds returned)
 *
 * The escrow suspense account is a stable, per-tenant internal account derived
 * deterministically from the tenant id, so no cross-service lookup is required. Postings are
 * idempotent via the ledger's unique transactionRef.
 */
@Slf4j
@Component
public class EscrowEventListener {

  private final LedgerService ledgerService;
  private final ObjectMapper objectMapper;

  public EscrowEventListener(LedgerService ledgerService, ObjectMapper objectMapper) {
    this.ledgerService = ledgerService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = "escrow.hold.created")
  public void onCreated(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    UUID tenantId = tenant(e);
    post(tenantId, "ESCROW-HOLD-" + id(e), source(e), suspense(tenantId), amount(e), currency(e), "ESCROW",
      "Escrow hold " + id(e));
  }

  @KafkaListener(topics = "escrow.hold.released")
  public void onReleased(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    UUID tenantId = tenant(e);
    post(tenantId, "ESCROW-RELEASE-" + id(e), suspense(tenantId), beneficiary(e), amount(e), currency(e), "ESCROW",
      "Escrow release " + id(e));
  }

  @KafkaListener(topics = "escrow.hold.refunded")
  public void onRefunded(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    UUID tenantId = tenant(e);
    post(tenantId, "ESCROW-REFUND-" + id(e), suspense(tenantId), source(e), amount(e), currency(e), "REFUND",
      "Escrow refund " + id(e));
  }

  private void post(UUID tenantId, String ref, UUID debit, UUID credit, BigDecimal amount, String currency, String type, String desc) {
    ledgerService.postEntry(tenantId, PostEntryRequest.builder()
      .transactionRef(ref)
      .debitAccountId(debit)
      .creditAccountId(credit)
      .amount(amount)
      .currency(currency)
      .entryType(type)
      .description(desc)
      .build());
    log.info("Escrow journal posted: ref={}, debit={}, credit={}, amount={}", ref, debit, credit, amount);
  }

  /** Deterministic, stable per-tenant escrow suspense account id (no external lookup needed). */
  private UUID suspense(UUID tenantId) {
    return UUID.nameUUIDFromBytes(("escrow-suspense:" + tenantId).getBytes(StandardCharsets.UTF_8));
  }

  private UUID tenant(JsonNode e) { return UUID.fromString(e.get("tenantId").asText()); }
  private String id(JsonNode e) { return e.get("id").asText(); }
  private UUID source(JsonNode e) { return UUID.fromString(e.get("sourceAccountId").asText()); }
  private UUID beneficiary(JsonNode e) { return UUID.fromString(e.get("beneficiaryAccountId").asText()); }
  private BigDecimal amount(JsonNode e) { return new BigDecimal(e.get("amount").asText()); }
  private String currency(JsonNode e) { return e.get("currency").asText(); }
}
