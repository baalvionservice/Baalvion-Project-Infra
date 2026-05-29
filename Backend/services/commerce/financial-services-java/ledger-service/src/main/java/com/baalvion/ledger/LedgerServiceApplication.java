package com.baalvion.ledger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Ledger Service: Double-entry bookkeeping for Global Trade Infrastructure
 *
 * Provides immutable journal entries, account statements, and balance tracking
 * with full multi-tenant isolation via PostgreSQL Row-Level Security.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class LedgerServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(LedgerServiceApplication.class, args);
  }

}
