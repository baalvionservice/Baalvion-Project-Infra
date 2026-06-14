package com.baalvion.risk;

import com.baalvion.risk.dto.AdjudicateRequest;
import com.baalvion.risk.dto.ScreenRequest;
import com.baalvion.risk.dto.ScreeningResponse;
import com.baalvion.risk.service.SanctionsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

/**
 * Sanctions screening against a real PostgreSQL: seed ingestion, an exact-alias hit escalating to
 * CONFIRMED_MATCH, a clean subject returning CLEAR, and officer adjudication to BLOCKED. Kafka mocked.
 */
@SpringBootTest(properties = {
  "spring.kafka.listener.auto-startup=false",
  "app.security.enabled=false",
  // Seed-list screening test — explicitly permissive (the production default is strict).
  "app.sanctions.enforcement=permissive"
})
@Testcontainers
class SanctionsScreeningIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
    .withDatabaseName("baalvion").withUsername("postgres").withPassword("postgres");

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @MockBean
  KafkaTemplate<String, String> kafkaTemplate;

  @Autowired
  SanctionsService sanctions;

  @BeforeEach
  void seed() {
    sanctions.ingest(); // idempotent upsert of the seed watchlist
    assertThat(sanctions.entityCount()).isGreaterThan(0);
  }

  @Test
  void exactAliasMatchEscalatesToConfirmedMatch() {
    UUID tenant = UUID.randomUUID();
    ScreenRequest req = new ScreenRequest();
    req.setName("Usama Bin Ladin");           // exact (normalized) alias of "Osama bin Laden"
    req.setType("INDIVIDUAL");
    req.setReferenceType("COUNTERPARTY");
    req.setReferenceId("cp-001");

    ScreeningResponse r = sanctions.screen(tenant, req);

    assertThat(r.getStatus()).isEqualTo("CONFIRMED_MATCH");
    assertThat(r.getTopScore().doubleValue()).isGreaterThanOrEqualTo(0.95);
    assertThat(r.getHitCount()).isGreaterThanOrEqualTo(1);
    assertThat(r.getHits().get(0).getMatchedName()).containsIgnoringCase("Usama");
  }

  @Test
  void fuzzyVariantIsAtLeastAPotentialMatch() {
    UUID tenant = UUID.randomUUID();
    ScreenRequest req = new ScreenRequest();
    req.setName("Viktor Anatolyevich But");   // transliteration of seeded "Viktor Bout" alias "Victor But"
    req.setType("INDIVIDUAL");

    ScreeningResponse r = sanctions.screen(tenant, req);

    assertThat(r.getStatus()).isIn("POTENTIAL_MATCH", "CONFIRMED_MATCH");
    assertThat(r.getHitCount()).isGreaterThanOrEqualTo(1);
  }

  @Test
  void cleanSubjectIsClear() {
    UUID tenant = UUID.randomUUID();
    ScreenRequest req = new ScreenRequest();
    req.setName("Maria Gabriela Fernandez");
    req.setType("INDIVIDUAL");

    ScreeningResponse r = sanctions.screen(tenant, req);

    assertThat(r.getStatus()).isEqualTo("CLEAR");
    assertThat(r.getHitCount()).isZero();
    assertThat(r.getTopScore().doubleValue()).isZero();
  }

  @Test
  void officerCanAdjudicateAConfirmedMatchToBlocked() {
    UUID tenant = UUID.randomUUID();
    ScreenRequest req = new ScreenRequest();
    req.setName("Wagner Group");
    req.setType("ORGANIZATION");
    ScreeningResponse screened = sanctions.screen(tenant, req);
    assertThat(screened.getStatus()).isIn("POTENTIAL_MATCH", "CONFIRMED_MATCH");

    AdjudicateRequest adj = new AdjudicateRequest();
    adj.setConfirmed(true);
    adj.setNote("Confirmed true hit against EU CFSP listing.");
    ScreeningResponse decided = sanctions.adjudicate(tenant, screened.getId(), "officer-1", adj);

    assertThat(decided.getStatus()).isEqualTo("BLOCKED");
    assertThat(decided.getAdjudicatedBy()).isEqualTo("officer-1");
    assertThat(decided.getAdjudicatedAt()).isNotNull();

    // Tenant isolation: another tenant cannot see this screening.
    assertThat(sanctions.list(UUID.randomUUID(), null, 0, 20).getTotalElements()).isZero();
  }

  @Test
  void screeningEventsDoNotCarrySubjectNamePii() {
    UUID tenant = UUID.randomUUID();
    ScreenRequest req = new ScreenRequest();
    req.setName("Usama Bin Ladin");      // a real (would-be PII) subject name
    req.setType("INDIVIDUAL");
    sanctions.screen(tenant, req);

    // The published event must carry identifiers + verdict only — never the raw screened name. Consumers
    // that need the name read it from the tenant-scoped DB row by (screeningId, tenantId).
    ArgumentCaptor<String> payload = ArgumentCaptor.forClass(String.class);
    verify(kafkaTemplate, atLeastOnce())
      .send(eq("sanctions.screening.completed"), anyString(), payload.capture());
    String json = payload.getValue();
    assertThat(json).contains("screeningId").contains("tenantId").contains("status");
    assertThat(json).doesNotContain("subjectName").doesNotContain("Usama");
  }
}
