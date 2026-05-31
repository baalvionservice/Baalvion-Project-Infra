package com.baalvion.fx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * FX Service.
 *
 * The platform's foreign-exchange engine: maintains a fresh multi-currency rate snapshot
 * (short TTL), prices spot conversions, issues rate-lock quotes held for a validity window, and
 * books forward contracts priced by covered interest-rate parity. Executed deals post real
 * currency movements (debit sell / credit buy) to the wallet/ledger services via the outbox.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class FxServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(FxServiceApplication.class, args);
  }
}
