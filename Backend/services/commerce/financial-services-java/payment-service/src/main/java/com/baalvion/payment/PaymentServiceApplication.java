package com.baalvion.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Payment Service: Payment processing with tiered fees and idempotency
 *
 * Processes payments across multiple schemes (NIP, VISA, Interswitch, Wallet),
 * calculates scheme-specific fees, prevents duplicates via idempotency,
 * and emits events to the ledger and settlement services.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class PaymentServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(PaymentServiceApplication.class, args);
  }

}
