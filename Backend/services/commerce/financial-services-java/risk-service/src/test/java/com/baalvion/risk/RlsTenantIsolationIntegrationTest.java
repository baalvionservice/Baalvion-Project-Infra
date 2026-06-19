package com.baalvion.risk;

import com.baalvion.risk.domain.RiskAssessment;
import com.baalvion.risk.repository.RiskAssessmentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * END-TO-END proof that RLS tenant isolation actually enforces at runtime — the
 * full stack: JWT tenant claim → AuthContext → RlsTenantAspect → RlsTenantSession
 * → set_config('app.current_tenant_id') inside the JPA transaction → Postgres RLS
 * policy → only the caller's rows.
 *
 * The decisive bit: the runtime datasource connects as the NON-SUPERUSER role
 * {@code baalvion_app} (RLS applies to it), while Flyway runs as the owner
 * ({@code postgres}, which bypasses RLS for DDL). This mirrors the production
 * user-split (layer 3a). If the aspect were mis-ordered and ran OUTSIDE the
 * transaction, the GUC would not be set and every read would return ZERO rows —
 * so this test also empirically validates the aspect/transaction ordering.
 */
@SpringBootTest(properties = {
  "spring.kafka.listener.auto-startup=false",
  "app.security.enabled=false",
  // RLS test, not a sanctions test; run permissive so the strict watchlist gate doesn't require live feeds.
  "app.sanctions.enforcement=permissive"
})
@Testcontainers
@Import(RlsTenantIsolationIntegrationTest.TenantReaderConfig.class)
class RlsTenantIsolationIntegrationTest {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
    .withDatabaseName("baalvion").withUsername("postgres").withPassword("postgres");

  static final String APP_USER = "baalvion_app";
  static final String APP_PW = "app_pw_test";
  static final UUID TENANT_A = UUID.fromString("11111111-1111-1111-1111-111111111111");
  static final UUID TENANT_B = UUID.fromString("22222222-2222-2222-2222-222222222222");

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    // The non-superuser runtime role must exist BEFORE the context starts: Flyway's
    // grant migration grants to it, and JPA connects as it. Create it as the owner.
    createAppRole();
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", () -> APP_USER);   // runtime → RLS applies
    registry.add("spring.datasource.password", () -> APP_PW);
    registry.add("spring.datasource.hikari.data-source-properties.stringtype", () -> "unspecified");
    registry.add("spring.flyway.user", postgres::getUsername);    // migrations → owner, bypasses RLS
    registry.add("spring.flyway.password", postgres::getPassword);
  }

  private static Connection owner() throws SQLException {
    return DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
  }

  private static void createAppRole() {
    try (Connection c = owner(); Statement s = c.createStatement()) {
      s.execute("DROP ROLE IF EXISTS " + APP_USER);
      s.execute("CREATE ROLE " + APP_USER + " LOGIN PASSWORD '" + APP_PW
        + "' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE");
    } catch (SQLException e) {
      throw new IllegalStateException("could not create test app role", e);
    }
  }

  @MockitoBean
  KafkaTemplate<String, String> kafkaTemplate;

  @Autowired
  TenantReader reader;

  @BeforeEach
  void seedAsOwnerAndClearAuth() throws SQLException {
    // Seed as the superuser owner, which bypasses RLS — two rows for A, one for B.
    try (Connection c = owner(); Statement s = c.createStatement()) {
      s.execute("DELETE FROM risk.risk_assessments");
      seedRow(c, TENANT_A);
      seedRow(c, TENANT_A);
      seedRow(c, TENANT_B);
    }
    SecurityContextHolder.clearContext();
  }

  @AfterEach
  void clearAuth() {
    SecurityContextHolder.clearContext();
  }

  private static void seedRow(Connection c, UUID tenant) throws SQLException {
    try (PreparedStatement p = c.prepareStatement(
      "INSERT INTO risk.risk_assessments (id, tenant_id, transaction_id, source_account_id, "
        + "amount, currency, scheme, score, decision, reasons, created_at) "
        + "VALUES (?,?,?,?,?,?,?,?,?,?, now())")) {
      p.setObject(1, UUID.randomUUID());
      p.setObject(2, tenant);
      p.setObject(3, UUID.randomUUID());
      p.setObject(4, UUID.randomUUID());
      p.setBigDecimal(5, new BigDecimal("100.00"));
      p.setString(6, "USD");
      p.setString(7, "NIP");
      p.setInt(8, 0);
      p.setString(9, "APPROVE");
      p.setString(10, "");
      p.executeUpdate();
    }
  }

  private static void authenticateAsTenant(UUID tenant) {
    Jwt jwt = Jwt.withTokenValue("test-token")
      .header("alg", "none")
      .subject("test-user")
      .claim("org_id", tenant.toString())
      .build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
  }

  @Test
  void eachTenantSeesOnlyItsOwnRows() {
    authenticateAsTenant(TENANT_A);
    List<RiskAssessment> a = reader.readAll();
    assertThat(a).hasSize(2);
    assertThat(a).allMatch(r -> r.getTenantId().equals(TENANT_A));

    authenticateAsTenant(TENANT_B);
    List<RiskAssessment> b = reader.readAll();
    assertThat(b).hasSize(1);
    assertThat(b).allMatch(r -> r.getTenantId().equals(TENANT_B));
  }

  @Test
  void unauthenticatedContextFailsClosed() {
    SecurityContextHolder.clearContext(); // no JWT → AuthContext empty → SYSTEM_TENANT (all-zero)
    // SYSTEM_TENANT matches none of the seeded rows → zero rows. No cross-tenant leak.
    assertThat(reader.readAll()).isEmpty();
  }

  @Test
  void crossTenantWriteIsRejectedByWithCheck() {
    authenticateAsTenant(TENANT_B);
    RiskAssessment rowForA = RiskAssessment.builder()
      .id(UUID.randomUUID())
      .tenantId(TENANT_A) // forging a tenant-A row while acting as tenant B
      .transactionId(UUID.randomUUID())
      .sourceAccountId(UUID.randomUUID())
      .amount(new BigDecimal("1.00"))
      .currency("USD")
      .scheme("NIP")
      .score(0)
      .decision(RiskAssessment.Decision.APPROVE)
      .reasons("")
      .createdAt(LocalDateTime.now())
      .build();
    assertThatThrownBy(() -> reader.write(rowForA))
      .as("RLS WITH CHECK must reject a row whose tenant_id != the session tenant")
      .isInstanceOf(Exception.class);
  }

  /** A normal @Transactional bean — the aspect sets the GUC on entry, the repo runs inside the same tx. */
  @TestConfiguration
  static class TenantReaderConfig {
    @Bean
    TenantReader tenantReader(RiskAssessmentRepository repo) {
      return new TenantReader(repo);
    }
  }

  static class TenantReader {
    private final RiskAssessmentRepository repo;

    TenantReader(RiskAssessmentRepository repo) {
      this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<RiskAssessment> readAll() {
      return repo.findAll();
    }

    @Transactional
    public RiskAssessment write(RiskAssessment ra) {
      return repo.saveAndFlush(ra);
    }
  }
}
