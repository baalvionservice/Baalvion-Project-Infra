package com.baalvion.risk;

import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import com.baalvion.risk.provider.SanctionsListProvider;
import com.baalvion.risk.provider.SanctionsListRecord;
import com.baalvion.risk.repository.SanctionedEntityRepository;
import com.baalvion.risk.service.SanctionsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Ingest commits in batches rather than in one transaction spanning the whole load. The record count
 * here is deliberately not a multiple of the batch size, so an off-by-one at a batch boundary would
 * drop or duplicate the tail.
 */
@SpringBootTest(properties = {
  "spring.kafka.listener.auto-startup=false",
  "app.security.enabled=false",
  "app.sanctions.enforcement=permissive",
  "app.sanctions.auto-seed-on-startup=false",
  "app.sanctions.ingest-batch-size=7"
})
@Testcontainers
class SanctionsIngestBatchingIntegrationTest {

  /** 23 records over a batch size of 7 → three full batches and a partial one. */
  private static final int RECORD_COUNT = 23;

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
    .withDatabaseName("baalvion").withUsername("postgres").withPassword("postgres");

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @TestConfiguration
  static class CountedProviderConfig {
    // Registered alongside the seed provider; the test selects it by name.
    @Bean
    SanctionsListProvider countedProvider() {
      return new SanctionsListProvider() {
        @Override public String name() { return "counted"; }
        @Override public List<SanctionsListRecord> fetch() {
          List<SanctionsListRecord> records = new ArrayList<>(RECORD_COUNT);
          for (int i = 0; i < RECORD_COUNT; i++) {
            records.add(SanctionsListRecord.builder()
              .listSource(ListSource.OFAC_SDN)
              .externalId("BATCH-" + i)
              .entityType(EntityType.INDIVIDUAL)
              .primaryName("Batch Subject " + i)
              .aliases(List.of("Alias A " + i, "Alias B " + i))
              .build());
          }
          return records;
        }
      };
    }
  }

  @MockitoBean
  KafkaTemplate<String, String> kafkaTemplate;

  @Autowired SanctionsService sanctions;
  @Autowired SanctionedEntityRepository entities;

  @Test
  void everyRecordSurvivesTheBatchBoundaries() {
    int upserted = sanctions.ingestProvider("counted");

    assertThat(upserted).isEqualTo(RECORD_COUNT);
    assertThat(entities.findByListSourceAndExternalId(ListSource.OFAC_SDN, "BATCH-0")).isPresent();
    assertThat(entities.findByListSourceAndExternalId(ListSource.OFAC_SDN, "BATCH-6")).isPresent();
    assertThat(entities.findByListSourceAndExternalId(ListSource.OFAC_SDN, "BATCH-7")).isPresent();
    assertThat(entities.findByListSourceAndExternalId(ListSource.OFAC_SDN, "BATCH-22")).isPresent();
  }

  @Test
  void reingestingIsIdempotentAcrossBatches() {
    sanctions.ingestProvider("counted");
    long afterFirst = entities.count();

    sanctions.ingestProvider("counted");

    assertThat(entities.count()).isEqualTo(afterFirst);
  }
}
