package com.baalvion.reconciliation;

import com.baalvion.reconciliation.dto.ReconRecord;
import com.baalvion.reconciliation.dto.ReconcileRequest;
import com.baalvion.reconciliation.dto.RunResponse;
import com.baalvion.reconciliation.service.ReconciliationService;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Reconciliation matching against a real PostgreSQL: matched / amount-mismatch exception /
 * unmatched on each side. Kafka is mocked.
 */
@SpringBootTest(properties = {
  "spring.kafka.listener.auto-startup=false",
  "app.security.enabled=false"
})
@Testcontainers
class ReconciliationServiceIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
    .withDatabaseName("baalvion").withUsername("postgres").withPassword("postgres");

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @MockitoBean
  KafkaTemplate<String, Object> kafkaTemplate;

  @Autowired
  ReconciliationService reconciliationService;

  @Test
  void classifiesMatchedExceptionAndUnmatched() {
    UUID tenant = UUID.randomUUID();
    ReconcileRequest request = ReconcileRequest.builder()
      .runRef("RUN-1")
      .internalRecords(List.of(
        new ReconRecord("TXN-A", new BigDecimal("100.00")),   // matches
        new ReconRecord("TXN-B", new BigDecimal("200.00")),   // amount mismatch
        new ReconRecord("TXN-C", new BigDecimal("300.00"))))  // missing external
      .externalRecords(List.of(
        new ReconRecord("TXN-A", new BigDecimal("100.00")),
        new ReconRecord("TXN-B", new BigDecimal("999.00")),
        new ReconRecord("TXN-D", new BigDecimal("400.00"))))  // missing internal
      .build();

    RunResponse run = reconciliationService.reconcile(tenant, request);

    assertThat(run.getMatchedCount()).isEqualTo(1);    // TXN-A
    assertThat(run.getExceptionCount()).isEqualTo(1);  // TXN-B amount mismatch
    assertThat(run.getUnmatchedCount()).isEqualTo(2);  // TXN-D (no internal) + TXN-C (no external)
    assertThat(run.getStatus()).isEqualTo("COMPLETED_WITH_EXCEPTIONS");

    // Idempotent on runRef.
    RunResponse again = reconciliationService.reconcile(tenant, request);
    assertThat(again.getId()).isEqualTo(run.getId());
  }
}
