package com.baalvion.account;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Account Service: Multi-tenant account management for Global Trade Infrastructure
 *
 * Manages individual/business/escrow/settlement/fee accounts, tracks available and
 * ledger balances, runs the KYC state machine, and enforces per-account transaction
 * limits. All data is isolated per tenant via PostgreSQL Row-Level Security.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class AccountServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(AccountServiceApplication.class, args);
  }

}
