package com.baalvion.escrow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Escrow Service: Conditional fund holds for Global Trade Infrastructure
 *
 * Holds funds from a source account into a dedicated escrow suspense account and
 * releases them to a beneficiary (or refunds to the originator) once release
 * conditions are met: time-based, event-based, or manual approval. Includes a
 * dispute workflow and scheduled auto-expiry handling.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class EscrowServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(EscrowServiceApplication.class, args);
  }

}
