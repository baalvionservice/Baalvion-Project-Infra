package com.baalvion.account;

import com.baalvion.account.dto.AccountResponse;
import com.baalvion.account.dto.CreateAccountRequest;
import com.baalvion.account.dto.UpdateKycRequest;
import com.baalvion.account.service.AccountService;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies the account KYC state machine and pessimistic-locked balance moves against a
 * real PostgreSQL (Flyway-migrated, RLS enabled). Kafka is mocked — no broker needed.
 */
@SpringBootTest(properties = {
  "spring.kafka.listener.auto-startup=false",
  "app.security.enabled=false"   // no IdP in the test context
})
@Testcontainers
class AccountServiceIntegrationTest {

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
  AccountService accountService;

  @Test
  void createsAccountAndEnforcesKycStateMachine() {
    UUID tenant = UUID.randomUUID();
    AccountResponse account = accountService.createAccount(tenant,
      CreateAccountRequest.builder().accountType("INDIVIDUAL").currency("USD").build());

    assertThat(account.getKycStatus()).isEqualTo("PENDING");
    assertThat(account.getAccountNumber()).hasSize(10);

    AccountResponse approved = accountService.updateKyc(tenant, account.getId(),
      UpdateKycRequest.builder().kycStatus("APPROVED").updatedBy("ops").build());
    assertThat(approved.getKycStatus()).isEqualTo("APPROVED");

    // APPROVED -> PENDING is not a permitted transition.
    assertThatThrownBy(() -> accountService.updateKyc(tenant, account.getId(),
      UpdateKycRequest.builder().kycStatus("PENDING").build()))
      .isInstanceOf(IllegalStateException.class);
  }

  @Test
  void creditThenDebitWithOverdraftGuard() {
    UUID tenant = UUID.randomUUID();
    AccountResponse account = accountService.createAccount(tenant,
      CreateAccountRequest.builder().accountType("BUSINESS").currency("USD").build());

    accountService.credit(tenant, account.getId(), new BigDecimal("100.00"), "fund");
    AccountResponse afterDebit = accountService.debit(tenant, account.getId(), new BigDecimal("40.00"), "spend");
    assertThat(afterDebit.getBalance()).isEqualByComparingTo("60.00");

    assertThatThrownBy(() -> accountService.debit(tenant, account.getId(), new BigDecimal("1000.00"), "overdraw"))
      .isInstanceOf(IllegalStateException.class);
  }
}
