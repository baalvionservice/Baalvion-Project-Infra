package com.baalvion.tradefinance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Trade Finance Service.
 *
 * Issues and administers two families of bank undertakings used to de-risk cross-border trade:
 *   - Documentary credits (Letters of Credit) under UCP 600 — issuance, amendment, document
 *     presentation/examination, and sight/usance settlement.
 *   - Independent guarantees (Bank Guarantees / standby) under URDG 758 — issuance, amendment,
 *     and demand/claim handling (pay or reject).
 *
 * Both instruments create a contingent liability on issuance and post real ledger movements on
 * settlement, emitted via the transactional outbox to the ledger/payment services.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class TradeFinanceServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(TradeFinanceServiceApplication.class, args);
  }
}
