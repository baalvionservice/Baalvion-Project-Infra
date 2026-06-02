package com.baalvion.smartcontract;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Smart Contract Service.
 *
 * Turns an agreed deal (term sheet) into a binding sale contract: it assembles the contract from
 * ICC Incoterms 2020 delivery clauses and UCP 600 payment clauses, then drives legally-binding
 * e-signature through a pluggable provider (DocuSeal in production, a self-contained simulator for
 * local/dev). When every party has signed, the contract is EXECUTED and the event is emitted via
 * the transactional outbox for the order, trade-finance and logistics services.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class SmartContractServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(SmartContractServiceApplication.class, args);
  }
}
