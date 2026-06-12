package com.baalvion.invoice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Invoice Service: Multi-tenant invoicing, accounts receivable and accounts payable for
 * Global Trade Infrastructure.
 *
 * Backs three product modules — Invoice Management, Accounts Receivable (AR) and Accounts
 * Payable (AP). Manages the invoice lifecycle state machine (DRAFT -> ISSUED -> PARTIALLY_PAID
 * /PAID/OVERDUE/DISPUTED/CANCELLED), records payments, and produces AR/AP aging summaries.
 * All data is isolated per tenant via PostgreSQL Row-Level Security.
 */
@SpringBootApplication
@EnableKafka
@EnableScheduling
public class InvoiceServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(InvoiceServiceApplication.class, args);
  }

}
