package com.baalvion.ledger;

import com.baalvion.ledger.dto.AccountBalanceResponse;
import com.baalvion.ledger.dto.EntryResponse;
import com.baalvion.ledger.dto.PostEntryRequest;
import com.baalvion.ledger.service.LedgerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies double-entry posting, idempotency on transactionRef, and reversal against a
 * real PostgreSQL (Flyway-migrated, RLS enabled). Kafka is mocked.
 */
@SpringBootTest(properties = {
  "spring.kafka.listener.auto-startup=false",
  "app.security.enabled=false"   // no IdP in the test context
})
@Testcontainers
class LedgerServiceIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
    .withDatabaseName("baalvion")
    .withUsername("postgres")
    .withPassword("postgres");

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @MockitoBean
  KafkaTemplate<String, String> kafkaTemplate;

  @Autowired
  LedgerService ledgerService;

  @Test
  void postsEntryIsIdempotentAndReversible() {
    UUID tenant = UUID.randomUUID();
    UUID debit = UUID.randomUUID();
    UUID credit = UUID.randomUUID();

    PostEntryRequest request = PostEntryRequest.builder()
      .transactionRef("TXN-IT-001")
      .debitAccountId(debit)
      .creditAccountId(credit)
      .amount(new BigDecimal("150.0000"))
      .currency("USD")
      .entryType("PAYMENT")
      .build();

    EntryResponse first = ledgerService.postEntry(tenant, request);
    // Same transactionRef returns the same entry (idempotent), not a duplicate.
    EntryResponse second = ledgerService.postEntry(tenant, request);
    assertThat(second.getId()).isEqualTo(first.getId());

    EntryResponse reversal = ledgerService.reverseEntry(tenant, first.getId());
    assertThat(reversal.getEntryType()).isEqualTo("REVERSAL");
    assertThat(reversal.getDebitAccountId()).isEqualTo(credit);
    assertThat(reversal.getCreditAccountId()).isEqualTo(debit);

    // Balance query runs (POSTED-only sum); a fresh debit account nets to zero here.
    AccountBalanceResponse balance = ledgerService.getAccountBalance(tenant, debit);
    assertThat(balance.getAccountId()).isEqualTo(debit);
  }
}
