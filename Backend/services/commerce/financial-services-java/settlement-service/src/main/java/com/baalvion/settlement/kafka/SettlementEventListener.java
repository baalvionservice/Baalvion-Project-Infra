package com.baalvion.settlement.kafka;

import com.baalvion.settlement.domain.SettlementBatch.Scheme;
import com.baalvion.settlement.service.SettlementService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Auto-feeds completed payments into the day's open settlement batch (design §5.4).
 * Only externally-settled schemes are batched; internal/escrow movements are skipped.
 */
@Slf4j
@Component
public class SettlementEventListener {

  private final SettlementService settlementService;
  private final ObjectMapper objectMapper;

  public SettlementEventListener(SettlementService settlementService, ObjectMapper objectMapper) {
    this.settlementService = settlementService;
    this.objectMapper = objectMapper;
  }

  @KafkaListener(topics = "payments.transaction.completed")
  public void onPaymentCompleted(String message) throws Exception {
    JsonNode e = objectMapper.readTree(message);
    String schemeName = e.hasNonNull("paymentScheme") ? e.get("paymentScheme").asText() : null;
    Scheme scheme = toSettlementScheme(schemeName);
    if (scheme == null) {
      log.debug("Skipping non-settled scheme {} for txn {}", schemeName, e.path("id").asText());
      return;
    }
    settlementService.addCompletedPayment(
      UUID.fromString(e.get("tenantId").asText()),
      UUID.fromString(e.get("id").asText()),
      e.path("idempotencyKey").asText(null),
      scheme,
      new BigDecimal(e.get("amount").asText()),
      e.hasNonNull("fee") ? new BigDecimal(e.get("fee").asText()) : BigDecimal.ZERO,
      e.get("currency").asText(),
      LocalDate.now(ZoneOffset.UTC)
    );
  }

  /** Maps a payment scheme to a settlement scheme, or null when it is not externally settled. */
  private Scheme toSettlementScheme(String name) {
    if (name == null) {
      return null;
    }
    return switch (name) {
      case "NIP" -> Scheme.NIP;
      case "VISA" -> Scheme.VISA;
      case "MASTERCARD" -> Scheme.MASTERCARD;
      case "INTERSWITCH" -> Scheme.INTERSWITCH;
      case "WALLET" -> Scheme.WALLET;
      default -> null; // INTERNAL / ESCROW are not externally settled
    };
  }
}
