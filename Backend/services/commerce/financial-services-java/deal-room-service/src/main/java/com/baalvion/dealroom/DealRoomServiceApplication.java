package com.baalvion.dealroom;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Deal Room Service.
 *
 * Hosts the real-time negotiation that turns a marketplace listing / RFQ award into a binding
 * commercial agreement:
 *   - a deal room per buyer/seller pair, with a chat thread;
 *   - a counter-offer engine — alternating price/quantity/Incoterm/delivery rounds, each round
 *     superseding the last, until one side accepts;
 *   - a term sheet generated on acceptance that both parties sign to reach an EXECUTED deal.
 *
 * Negotiation events are pushed live to participants over WebSocket and emitted via the
 * transactional outbox (dealroom.deal.agreed / dealroom.termsheet.executed) for the
 * smart-contract, order and trade-finance services.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class DealRoomServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(DealRoomServiceApplication.class, args);
  }
}
