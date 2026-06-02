package com.baalvion.trustscore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

/**
 * Trust Score Service.
 *
 * Maintains a composite 0-1000 trust score for every counterparty (customer, supplier, organization).
 * A pluggable scoring engine combines weighted factors — KYC verification, payment reliability,
 * dispute rate, trading activity, account tenure, and sanctions/compliance — into a banded score.
 * The current score is kept per subject alongside an append-only history of every recompute (with the
 * delta and the reason), and each change is emitted via the transactional outbox (trustscore.updated)
 * so credit, risk and pricing services can react.
 */
@SpringBootApplication
@EnableKafka
public class TrustScoreServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(TrustScoreServiceApplication.class, args);
  }
}
