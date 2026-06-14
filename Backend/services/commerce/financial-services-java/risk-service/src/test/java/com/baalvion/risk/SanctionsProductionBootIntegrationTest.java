package com.baalvion.risk;

import com.baalvion.risk.config.SanctionsEnforcement;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import com.baalvion.risk.dto.ScreenRequest;
import com.baalvion.risk.dto.ScreeningResponse;
import com.baalvion.risk.health.SanctionsHealthIndicator;
import com.baalvion.risk.health.SanctionsStatusReporter;
import com.baalvion.risk.provider.SanctionsListProvider;
import com.baalvion.risk.service.SanctionsService;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.mockito.Mockito;
import org.springframework.boot.actuate.health.Status;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.KafkaTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Full-runtime verification of the production sanctions path — NO unit-level shortcuts. The ENTIRE service
 * is booted (Spring context + Flyway-migrated Postgres via Testcontainers) in {@code STRICT} enforcement,
 * with the OFAC/UN/EU providers pointed at a local HTTP server returning authoritative-FORMAT sample
 * feeds. This exercises the real fetch → parse → ingest → screen path end to end; the only test seam is the
 * feed origin (a controlled HTTP server, not a mock fallback inside the application flow).
 *
 * <ul>
 *   <li>Positive: the service boots only after OFAC+UN+EU are loaded and non-empty, the seed provider is
 *       absent, a real subject screens to a match, and the health/endpoint report UP.</li>
 *   <li>Fail-fast on empty feed: a cold DB + empty OFAC feed aborts startup.</li>
 *   <li>Fail-fast on missing config: a required provider left disabled aborts startup (req: deployment must
 *       fail if required env/profile is missing).</li>
 * </ul>
 */
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SanctionsProductionBootIntegrationTest {

  @Container
  static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
    .withDatabaseName("baalvion").withUsername("postgres").withPassword("postgres");

  private static HttpServer feeds;
  private static String feedBase;

  // Authoritative-format sample payloads (mirroring the provider parser unit tests). Swapped per test.
  private static volatile String ofacSdn;
  private static volatile String ofacAlt;
  private static volatile String ofacAdd;
  private static volatile String unXml;
  private static volatile String euXml;

  // ----- OFAC SDN feeds (headerless CSV; "-0- " is the empty sentinel) -----
  private static final String OFAC_SDN =
    "\"1001\",\"PUTIN, Vladimir\",\"individual\",\"RUSSIA-EO14024\",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"Born 1952\"\n"
      + "\"1002\",\"WAGNER GROUP\",\"entity\",\"RUSSIA-EO14024] [SDGT\",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \"\n"
      + "\"1003\",\"GRACE 1\",\"vessel\",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \"\n";
  private static final String OFAC_ALT =
    "\"1001\",\"1\",\"aka\",\"PUTIN, Vladimir Vladimirovich\",\"-0- \"\n"
      + "\"1002\",\"2\",\"aka\",\"PMC WAGNER\",\"-0- \"\n";
  private static final String OFAC_ADD =
    "\"1001\",\"1\",\"-0- \",\"Moscow\",\"Russia\",\"-0- \"\n"
      + "\"1003\",\"1\",\"-0- \",\"-0- \",\"Iran\",\"-0- \"\n";

  private static final String UN_XML = """
    <CONSOLIDATED_LIST dateGenerated="2026-05-01T00:00:00">
      <INDIVIDUALS>
        <INDIVIDUAL>
          <DATAID>6908555</DATAID>
          <FIRST_NAME>Usama</FIRST_NAME><SECOND_NAME>Mohammed</SECOND_NAME><THIRD_NAME>Awad</THIRD_NAME>
          <UN_LIST_TYPE>Al-Qaida</UN_LIST_TYPE>
          <INDIVIDUAL_ALIAS><ALIAS_NAME>Osama bin Laden</ALIAS_NAME></INDIVIDUAL_ALIAS>
          <NATIONALITY><VALUE>Saudi Arabia</VALUE></NATIONALITY>
        </INDIVIDUAL>
      </INDIVIDUALS>
      <ENTITIES>
        <ENTITY>
          <DATAID>6908600</DATAID>
          <FIRST_NAME>AL QAIDA</FIRST_NAME>
          <UN_LIST_TYPE>Al-Qaida</UN_LIST_TYPE>
          <ENTITY_ALIAS><ALIAS_NAME>The Base</ALIAS_NAME></ENTITY_ALIAS>
        </ENTITY>
      </ENTITIES>
    </CONSOLIDATED_LIST>
    """;

  private static final String EU_XML = """
    <export xmlns="http://eu.europa.ec/fpi/fsd/export">
      <sanctionEntity logicalId="13" euReferenceNumber="EU.27.28">
        <subjectType code="person"/>
        <regulation programme="UKR"/>
        <nameAlias wholeName="Vladimir Putin" firstName="Vladimir" lastName="Putin"/>
        <nameAlias wholeName="Vladimir Vladimirovich Putin"/>
        <address countryDescription="RUSSIA" countryIso2Code="RU" city="Moscow"/>
      </sanctionEntity>
      <sanctionEntity logicalId="99">
        <subjectType code="enterprise"/>
        <regulation programme="SYR"/>
        <nameAlias wholeName="Acme Trading LLC"/>
      </sanctionEntity>
    </export>
    """;

  @BeforeAll
  static void startFeedServer() throws Exception {
    feeds = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    context("/ofac/sdn.csv", () -> ofacSdn);
    context("/ofac/alt.csv", () -> ofacAlt);
    context("/ofac/add.csv", () -> ofacAdd);
    context("/un/consolidated.xml", () -> unXml);
    context("/eu/fsd.xml", () -> euXml);
    feeds.start();
    feedBase = "http://127.0.0.1:" + feeds.getAddress().getPort();
  }

  @AfterAll
  static void stopFeedServer() {
    if (feeds != null) {
      feeds.stop(0);
    }
  }

  @BeforeEach
  void resetToPopulatedFeeds() {
    ofacSdn = OFAC_SDN;
    ofacAlt = OFAC_ALT;
    ofacAdd = OFAC_ADD;
    unXml = UN_XML;
    euXml = EU_XML;
  }

  private static void context(String path, Supplier<String> body) {
    feeds.createContext(path, exchange -> {
      byte[] bytes = body.get().getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().add("Content-Type", "text/plain; charset=utf-8");
      // length 0 => no body (the providers treat a blank feed as a hard fetch failure).
      exchange.sendResponseHeaders(200, bytes.length == 0 ? -1 : bytes.length);
      try (OutputStream os = exchange.getResponseBody()) {
        os.write(bytes);
      }
    });
  }

  // --------------------------------------------------------------------------- boot harness

  private static Map<String, Object> baseProps() {
    Map<String, Object> p = new HashMap<>();
    p.put("server.port", 0);
    p.put("spring.kafka.listener.auto-startup", false);
    p.put("app.security.enabled", false);
    p.put("spring.datasource.url", postgres.getJdbcUrl());
    p.put("spring.datasource.username", postgres.getUsername());
    p.put("spring.datasource.password", postgres.getPassword());
    p.put("spring.datasource.hikari.data-source-properties.stringtype", "unspecified");
    p.put("spring.flyway.user", postgres.getUsername());
    p.put("spring.flyway.password", postgres.getPassword());
    // STRICT production posture with the real providers pointed at the local feed server.
    p.put("app.sanctions.enforcement", "strict");
    p.put("app.sanctions.provider", "live");
    p.put("app.sanctions.ofac.enabled", true);
    p.put("app.sanctions.un.enabled", true);
    p.put("app.sanctions.eu.enabled", true);
    p.put("app.sanctions.ofac.sdn-url", feedBase + "/ofac/sdn.csv");
    p.put("app.sanctions.ofac.alt-url", feedBase + "/ofac/alt.csv");
    p.put("app.sanctions.ofac.add-url", feedBase + "/ofac/add.csv");
    p.put("app.sanctions.un.url", feedBase + "/un/consolidated.xml");
    p.put("app.sanctions.eu.url", feedBase + "/eu/fsd.xml");
    // Sample-scaled minimums (production keeps the high defaults from application.yml).
    p.put("app.sanctions.min-entities.ofac", 1);
    p.put("app.sanctions.min-entities.un", 1);
    p.put("app.sanctions.min-entities.eu", 1);
    // Fail fast on an unreachable/empty feed instead of retrying for seconds.
    p.put("app.sanctions.ofac.max-retries", 1);
    p.put("app.sanctions.ofac.retry-backoff-ms", 0);
    return p;
  }

  private static ConfigurableApplicationContext boot(Map<String, Object> overrides) {
    Map<String, Object> props = baseProps();
    props.putAll(overrides);
    // Pass as command-line args (NOT SpringApplicationBuilder.properties(), which are *default* properties
    // that application.yml would override) so these win over the baked-in localhost datasource defaults.
    String[] args = props.entrySet().stream()
      .map(e -> "--" + e.getKey() + "=" + e.getValue())
      .toArray(String[]::new);
    return new SpringApplicationBuilder(RiskServiceApplication.class, StubKafka.class).run(args);
  }

  private static void truncateWatchlist() throws Exception {
    try (Connection c = DriverManager.getConnection(
        postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
         Statement s = c.createStatement()) {
      s.execute("TRUNCATE risk.sanctioned_entities CASCADE");
    }
  }

  // --------------------------------------------------------------------------- tests

  @Test
  @Order(1)
  void strictBootLoadsRealFeedsThenScreensAndReportsHealthy() {
    try (ConfigurableApplicationContext ctx = boot(Map.of())) {
      SanctionsService svc = ctx.getBean(SanctionsService.class);

      // (1) Authoritative lists actually loaded and non-empty — proved against the DB, not config.
      assertThat(svc.entityCount(ListSource.OFAC_SDN)).isGreaterThan(0);
      assertThat(svc.entityCount(ListSource.UN_CONSOLIDATED)).isGreaterThan(0);
      assertThat(svc.entityCount(ListSource.EU_CFSP)).isGreaterThan(0);

      // (2) The dev seed provider is NOT in the running context; only live jurisdictions are.
      List<String> providerNames = ctx.getBeansOfType(SanctionsListProvider.class).values().stream()
        .map(SanctionsListProvider::name).toList();
      assertThat(providerNames).contains("ofac", "un", "eu").doesNotContain("seed");

      // (3) A real sanctioned subject screens to a confirmed/potential match through the live data.
      ScreenRequest req = new ScreenRequest();
      req.setName("Vladimir Putin");
      req.setType("INDIVIDUAL");
      ScreeningResponse r = svc.screen(UUID.randomUUID(), req);
      assertThat(r.getStatus()).isIn("CONFIRMED_MATCH", "POTENTIAL_MATCH");
      assertThat(r.getHitCount()).isGreaterThanOrEqualTo(1);

      // (4) Health + endpoint report the dataset as UP/healthy with per-source detail.
      SanctionsStatusReporter.Report report = ctx.getBean(SanctionsStatusReporter.class).build();
      assertThat(report.enforcement()).isEqualTo(SanctionsEnforcement.STRICT);
      assertThat(report.healthy()).isTrue();
      assertThat(report.sources()).extracting(SanctionsStatusReporter.SourceReport::code)
        .contains("OFAC", "UN", "EU");
      assertThat(ctx.getBean(SanctionsHealthIndicator.class).health().getStatus()).isEqualTo(Status.UP);
    }
  }

  @Test
  @Order(2)
  void strictBootFailsFastWhenRequiredFeedIsEmpty() throws Exception {
    truncateWatchlist();            // cold DB => no last-known-good to fall back on
    ofacSdn = "";                   // OFAC feed returns empty => provider load fails
    ofacAlt = "";
    ofacAdd = "";

    assertThatThrownBy(() -> boot(Map.of()))
      .hasStackTraceContaining("SANCTIONS COMPLIANCE FAIL-SAFE")
      .hasStackTraceContaining("ofac");
  }

  @Test
  @Order(3)
  void strictBootFailsFastWhenRequiredProviderIsDisabled() {
    // Required source 'un' present in config but its provider left disabled (missing env) => deploy fails.
    assertThatThrownBy(() -> boot(Map.of("app.sanctions.un.enabled", false)))
      .hasStackTraceContaining("SANCTIONS COMPLIANCE FAIL-SAFE")
      .hasStackTraceContaining("un");
  }

  /** Replaces the real KafkaTemplate so screening's event publish neither blocks nor needs a broker. */
  @TestConfiguration
  static class StubKafka {
    @Bean
    @Primary
    @SuppressWarnings("unchecked")
    KafkaTemplate<String, String> stubKafkaTemplate() {
      return Mockito.mock(KafkaTemplate.class);
    }
  }
}
