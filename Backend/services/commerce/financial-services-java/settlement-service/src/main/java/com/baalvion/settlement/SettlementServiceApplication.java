package com.baalvion.settlement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Settlement Service: Net settlement and scheme file generation for Global Trade Infrastructure
 *
 * Aggregates completed payments into settlement batches (T+0 real-time or T+1 batch),
 * computes net settlement positions per scheme, and generates scheme-specific
 * settlement files (Visa EP745, Mastercard T112, Interswitch ISO 8583). All data is
 * tenant-isolated via PostgreSQL Row-Level Security.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class SettlementServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(SettlementServiceApplication.class, args);
  }

}
