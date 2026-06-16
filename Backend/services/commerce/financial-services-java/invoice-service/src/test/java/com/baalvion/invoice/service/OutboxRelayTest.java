package com.baalvion.invoice.service;

import com.baalvion.invoice.domain.OutboxEvent;
import com.baalvion.invoice.domain.OutboxEvent.OutboxStatus;
import com.baalvion.invoice.repository.OutboxEventRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Validates the no-event-loss guarantees of {@link OutboxRelay}: per-row outcome isolation,
 * bounded-backoff retry, dead-letter after the attempt cap, and that one poison row never blocks
 * the rest of the batch. These are the properties that make the transactional outbox safe to
 * replace the old fire-and-forget kafkaTemplate.send.
 */
@SuppressWarnings("unchecked")
class OutboxRelayTest {

  private OutboxEventRepository repository;
  private KafkaTemplate<String, String> kafkaTemplate;
  private OutboxRelay self;   // mock so drain()'s REQUIRES_NEW proxy calls are observable
  private OutboxRelay relay;  // real instance under test

  @BeforeEach
  void setUp() {
    repository = mock(OutboxEventRepository.class);
    kafkaTemplate = mock(KafkaTemplate.class);
    self = mock(OutboxRelay.class);
    relay = new OutboxRelay(repository, kafkaTemplate, new SimpleMeterRegistry(), self);
    // @Value fields aren't injected in a plain unit test — set the tuning knobs explicitly.
    ReflectionTestUtils.setField(relay, "batchSize", 100);
    ReflectionTestUtils.setField(relay, "maxAttempts", 3);
    ReflectionTestUtils.setField(relay, "sendTimeoutMs", 10_000L);
    ReflectionTestUtils.setField(relay, "backoffBaseMs", 2_000L);
    ReflectionTestUtils.setField(relay, "backoffMaxMs", 300_000L);
    ReflectionTestUtils.setField(relay, "leaseMs", 60_000L);
  }

  private OutboxEvent pending(int attempts) {
    return OutboxEvent.builder()
      .id(UUID.randomUUID())
      .tenantId(UUID.randomUUID())
      .topic("invoice.payment.recorded")
      .msgKey(UUID.randomUUID().toString())
      .payload("{\"k\":1}")
      .status(OutboxStatus.PENDING)
      .attempts(attempts)
      .availableAt(LocalDateTime.now())
      .build();
  }

  @Test
  @DisplayName("persistResult marks a successfully-published row SENT")
  void persistResult_success_marksSent() {
    OutboxEvent e = pending(0);
    relay.persistResult(e, null);

    assertThat(e.getStatus()).isEqualTo(OutboxStatus.SENT);
    assertThat(e.getSentAt()).isNotNull();
    verify(repository).save(e);
  }

  @Test
  @DisplayName("persistResult defers a failed row with backoff and keeps it PENDING (retryable)")
  void persistResult_failure_belowCap_defersPending() {
    OutboxEvent e = pending(0);
    LocalDateTime before = LocalDateTime.now();

    relay.persistResult(e, new RuntimeException("broker down"));

    assertThat(e.getStatus()).isEqualTo(OutboxStatus.PENDING);
    assertThat(e.getAttempts()).isEqualTo(1);
    assertThat(e.getLastError()).contains("broker down");
    // attempt 1 → base 2000ms in the future (backoff defers the retry).
    assertThat(e.getAvailableAt()).isAfter(before.plusSeconds(1));
    verify(repository).save(e);
  }

  @Test
  @DisplayName("persistResult dead-letters (FAILED) once attempts reach maxAttempts")
  void persistResult_failure_atCap_marksFailed() {
    OutboxEvent e = pending(2); // next attempt is the 3rd == maxAttempts
    relay.persistResult(e, new RuntimeException("still down"));

    assertThat(e.getAttempts()).isEqualTo(3);
    assertThat(e.getStatus()).isEqualTo(OutboxStatus.FAILED);
    verify(repository).save(e);
  }

  @Test
  @DisplayName("persistResult sanitizes CR/LF out of the recorded last_error")
  void persistResult_sanitizesError() {
    OutboxEvent e = pending(0);
    relay.persistResult(e, new RuntimeException("line1\nline2\rtab\there"));
    assertThat(e.getLastError()).doesNotContain("\n").doesNotContain("\r").doesNotContain("\t");
  }

  @Test
  @DisplayName("drain publishes a claimed batch and records each outcome")
  void drain_publishesBatch() {
    OutboxEvent e = pending(0);
    when(self.claimBatch()).thenReturn(List.of(e));
    when(kafkaTemplate.send(anyString(), anyString(), anyString()))
      .thenReturn(CompletableFuture.completedFuture((SendResult<String, String>) null));

    relay.drain();

    verify(kafkaTemplate).send(e.getTopic(), e.getMsgKey(), e.getPayload());
    // success → null failure passed to persistResult (recorded in its own REQUIRES_NEW tx via self).
    verify(self).persistResult(e, null);
  }

  @Test
  @DisplayName("drain: a poison row that fails to publish does NOT block its siblings")
  void drain_poisonRowDoesNotBlockSiblings() {
    OutboxEvent good = pending(0);
    OutboxEvent poison = pending(0);
    OutboxEvent good2 = pending(0);
    when(self.claimBatch()).thenReturn(List.of(good, poison, good2));
    when(kafkaTemplate.send(anyString(), anyString(), any()))
      .thenReturn(CompletableFuture.completedFuture((SendResult<String, String>) null))         // good
      .thenReturn(CompletableFuture.failedFuture(new RuntimeException("poison")))                // poison
      .thenReturn(CompletableFuture.completedFuture((SendResult<String, String>) null));         // good2

    relay.drain();

    // All three are attempted and each outcome persisted independently — no early break.
    verify(kafkaTemplate, times(3)).send(anyString(), anyString(), any());
    verify(self).persistResult(eq(good), org.mockito.ArgumentMatchers.isNull());
    verify(self).persistResult(eq(good2), org.mockito.ArgumentMatchers.isNull());
    verify(self).persistResult(eq(poison), org.mockito.ArgumentMatchers.any(Exception.class));
  }

  // Local alias to keep the verify lines readable.
  private static <T> T eq(T value) { return org.mockito.ArgumentMatchers.eq(value); }
}
