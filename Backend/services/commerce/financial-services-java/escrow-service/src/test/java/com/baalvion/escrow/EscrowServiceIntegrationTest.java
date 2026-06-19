package com.baalvion.escrow;

import com.baalvion.escrow.dto.CreateEscrowRequest;
import com.baalvion.escrow.dto.EscrowResponse;
import com.baalvion.escrow.service.EscrowService;
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
 * Escrow lifecycle against a real PostgreSQL: hold → release / refund, idempotency on ref, and
 * illegal-transition guards. Kafka is mocked.
 */
@SpringBootTest(properties = {
  "spring.kafka.listener.auto-startup=false",
  "app.security.enabled=false"
})
@Testcontainers
class EscrowServiceIntegrationTest {

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
  EscrowService escrowService;

  private CreateEscrowRequest hold(String ref) {
    return CreateEscrowRequest.builder()
      .escrowRef(ref)
      .sourceAccountId(UUID.randomUUID())
      .beneficiaryAccountId(UUID.randomUUID())
      .amount(new BigDecimal("500.0000"))
      .currency("USD")
      .releaseCondition("MANUAL")
      .build();
  }

  @Test
  void holdThenReleaseIsIdempotentOnRef() {
    UUID tenant = UUID.randomUUID();
    EscrowResponse held = escrowService.createHold(tenant, hold("ESC-1"));
    assertThat(held.getStatus()).isEqualTo("HELD");

    // Same ref returns the same hold, not a duplicate.
    EscrowResponse again = escrowService.createHold(tenant, hold("ESC-1"));
    assertThat(again.getId()).isEqualTo(held.getId());

    EscrowResponse released = escrowService.release(tenant, held.getId(), null);
    assertThat(released.getStatus()).isEqualTo("RELEASED");
    assertThat(released.getReleasedAt()).isNotNull();
  }

  @Test
  void refundFromHeld() {
    UUID tenant = UUID.randomUUID();
    EscrowResponse held = escrowService.createHold(tenant, hold("ESC-2"));
    EscrowResponse refunded = escrowService.refund(tenant, held.getId(), null);
    assertThat(refunded.getStatus()).isEqualTo("REFUNDED");
    // Cannot release after refund.
    assertThatThrownBy(() -> escrowService.release(tenant, held.getId(), null))
      .isInstanceOf(IllegalStateException.class);
  }
}
