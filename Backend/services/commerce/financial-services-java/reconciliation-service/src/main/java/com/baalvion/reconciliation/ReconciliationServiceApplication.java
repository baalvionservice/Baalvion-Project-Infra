package com.baalvion.reconciliation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Reconciliation Service: Inbound settlement matching for Global Trade Infrastructure
 *
 * Parses inbound settlement advices (external records) and matches them against the
 * platform's internal records by transaction reference. Mismatches and orphans are
 * routed to an exception queue with a manual resolution workflow. All data is
 * tenant-isolated via PostgreSQL Row-Level Security.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class ReconciliationServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(ReconciliationServiceApplication.class, args);
  }

}
