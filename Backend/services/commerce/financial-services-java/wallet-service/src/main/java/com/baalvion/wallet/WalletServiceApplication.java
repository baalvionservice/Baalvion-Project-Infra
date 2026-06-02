package com.baalvion.wallet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Wallet Service.
 *
 * The platform's multi-currency wallet: each holder (user/organization/merchant) has one wallet
 * with a balance per currency. Supports deposits, withdrawals/payouts, holds (reserve → capture
 * or release), same-currency transfers between wallets, and in-wallet conversions at a supplied
 * rate. Every movement is recorded in an append-only ledger and mirrored to the ledger service
 * via the transactional outbox.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class WalletServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(WalletServiceApplication.class, args);
  }
}
