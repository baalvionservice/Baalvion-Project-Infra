package com.baalvion.dispute;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Dispute Service.
 *
 * Resolves trade disputes through three escalating tiers:
 *   1. AI triage — an automated assessment recommends an outcome (resolve in favour / split /
 *      escalate) the instant a dispute is raised;
 *   2. Human mediation — a mediator is assigned and proposes a settlement both parties may accept;
 *   3. ICC arbitration — if mediation fails, an arbitrator issues a binding award.
 *
 * Lifecycle transitions emit events via the transactional outbox (dispute.opened / escalated /
 * resolved) for the order, escrow and trade-finance services (e.g. to release or claw back escrow).
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class DisputeServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(DisputeServiceApplication.class, args);
  }
}
