package com.baalvion.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Payment Service: Payment processing with tiered fees and idempotency
 *
 * Processes payments across multiple schemes (NIP, VISA, Interswitch, Wallet),
 * calculates scheme-specific fees, prevents duplicates via idempotency,
 * and emits events to the ledger and settlement services.
 *
 * <p>Kafka is OPTIONAL and gated behind {@code app.kafka.enabled} (default true). When disabled
 * (e.g. on a memory-constrained single host), {@code @EnableKafka} + the Kafka listener/producer
 * wiring move to {@link com.baalvion.payment.config.KafkaConfig}, which backs off entirely. The
 * synchronous PSP gateway-checkout vertical ({@code /v1/gateway/**}) does not depend on Kafka.
 */
@SpringBootApplication
@EnableScheduling
public class PaymentServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(PaymentServiceApplication.class, args);
  }

}
