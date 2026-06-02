package com.baalvion.paymentrails;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Payment Rails Service.
 *
 * The routing brain for outbound (and inbound) money movement. Given a payment instruction it
 * selects the optimal clearing rail by currency, creditor country, amount and urgency
 * (SWIFT for cross-border; SEPA/SEPA Instant in the euro area; ACH/FedWire in the US; UPI in India;
 * Pix in Brazil; M-Pesa in Kenya; SPEI in Mexico; PayNow/FPS in APAC), submits it through a
 * pluggable rail provider (a self-contained simulator for dev, real PSP adapters for production),
 * and tracks the instruction to SETTLED/FAILED — emitting events via the transactional outbox for
 * the ledger and settlement services.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class PaymentRailsServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(PaymentRailsServiceApplication.class, args);
  }
}
