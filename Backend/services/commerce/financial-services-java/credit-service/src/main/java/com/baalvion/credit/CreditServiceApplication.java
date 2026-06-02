package com.baalvion.credit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Credit Service.
 *
 * Two short-term financing products for cross-border trade:
 *   - Invoice Finance (factoring / invoice discounting): advance a percentage of an approved
 *     receivable, recover advance + fee on collection, remit the reserve to the seller.
 *   - Trade BNPL: pay the merchant up-front and let the buyer repay over a bullet term or an
 *     installment schedule, with interest, late fees and delinquency handling.
 *
 * Both run through a deterministic credit-risk engine and post real ledger movements
 * (disbursement, repayment, write-off) via the transactional outbox.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class CreditServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(CreditServiceApplication.class, args);
  }
}
