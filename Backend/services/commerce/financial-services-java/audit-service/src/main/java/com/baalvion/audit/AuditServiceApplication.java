package com.baalvion.audit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Audit Service: Immutable audit trail for Global Trade Infrastructure
 *
 * Provides an append-only compliance log. Audit entries arrive two ways:
 *   1. REST ingestion ({@code POST /api/v1/audit/events}) from services and the gateway, and
 *   2. Kafka aggregation — a topic-pattern listener records every domain event
 *      (payments / ledger / settlement / escrow / account) it observes.
 *
 * Entries are never updated or deleted. Payloads are stored as JSONB with a GIN index
 * for compliance queries (per design §6.3). Tenant-isolated via PostgreSQL RLS.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class AuditServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(AuditServiceApplication.class, args);
  }

}
