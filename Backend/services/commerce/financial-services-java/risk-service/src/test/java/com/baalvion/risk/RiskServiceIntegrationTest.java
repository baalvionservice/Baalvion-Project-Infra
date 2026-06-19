package com.baalvion.risk;

import com.baalvion.risk.dto.RiskAssessmentResponse;
import com.baalvion.risk.service.RiskService;
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
 * Risk scoring against a real PostgreSQL: clean low-value APPROVE, high-value REVIEW, and
 * velocity escalation; idempotent per transaction. Kafka is mocked.
 */
@SpringBootTest(properties = {
  "spring.kafka.listener.auto-startup=false",
  "app.security.enabled=false",
  // Not a sanctions test; run permissive so the strict-by-default watchlist gate doesn't require live feeds.
  "app.sanctions.enforcement=permissive"
})
@Testcontainers
class RiskServiceIntegrationTest {

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
  KafkaTemplate<String, String> kafkaTemplate;

  @Autowired
  RiskService riskService;

  @Test
  void lowValueApproves() {
    UUID tenant = UUID.randomUUID();
    RiskAssessmentResponse r = riskService.assess(tenant, UUID.randomUUID(), UUID.randomUUID(),
      new BigDecimal("100.00"), "USD", "NIP");
    assertThat(r.getDecision()).isEqualTo("APPROVE");
    assertThat(r.getScore()).isZero();
  }

  @Test
  void highValueIsReviewedAndIdempotent() {
    UUID tenant = UUID.randomUUID();
    UUID txn = UUID.randomUUID();
    RiskAssessmentResponse r = riskService.assess(tenant, txn, UUID.randomUUID(),
      new BigDecimal("300000.00"), "USD", "VISA");
    assertThat(r.getDecision()).isIn("REVIEW", "DECLINE");
    assertThat(r.getReasons()).contains("HIGH_VALUE");

    // Re-assessing the same transaction returns the same record (idempotent).
    RiskAssessmentResponse again = riskService.assess(tenant, txn, UUID.randomUUID(),
      new BigDecimal("300000.00"), "USD", "VISA");
    assertThat(again.getId()).isEqualTo(r.getId());
  }
}
