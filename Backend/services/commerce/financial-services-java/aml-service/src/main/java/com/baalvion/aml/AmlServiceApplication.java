package com.baalvion.aml;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

/**
 * AML Service.
 *
 * Continuous anti-money-laundering transaction monitoring. A pluggable rules engine screens each
 * transaction for typologies (structuring/smurfing, high-value, velocity, round-amount, payments
 * to/from FATF high-risk jurisdictions), scores it and raises an alert with a FATF-aligned risk
 * grade when warranted. Alerts run an investigate → clear / escalate / file-SAR case workflow, and
 * raised/escalated alerts are emitted via the transactional outbox for the compliance dashboard and
 * trust-score service.
 */
@SpringBootApplication
@EnableKafka
public class AmlServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(AmlServiceApplication.class, args);
  }
}
