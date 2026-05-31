package com.baalvion.risk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Risk Service: transaction monitoring and fraud detection for Global Trade Infrastructure
 *
 * Consumes {@code payments.transaction.initiated}, scores each transaction against
 * value and velocity rules, records an assessment, and publishes
 * {@code risk.assessment.completed} (APPROVE / REVIEW / DECLINE). Tenant-isolated via RLS.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class RiskServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(RiskServiceApplication.class, args);
  }

}
