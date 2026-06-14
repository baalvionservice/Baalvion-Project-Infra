package com.baalvion.ledger.service;

import com.baalvion.ledger.domain.LedgerOutbox;
import com.baalvion.ledger.domain.LedgerOutbox.OutboxStatus;
import com.baalvion.ledger.repository.LedgerOutboxRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifies the canonical three-phase relay: claim+lease in a short tx, publish each row OUTSIDE any
 * tx (synchronously, never swallowing failure), then persist each row's outcome in its OWN short tx
 * ({@code save} per row, so one failure can't roll back another's SENT). FOR UPDATE SKIP LOCKED on
 * the claim means two instances cannot double-publish.
 */
class LedgerOutboxRelayTest {

  private LedgerOutboxRepository repository;
  private KafkaTemplate<String, String> kafkaTemplate;
  private LedgerOutboxRelay relay;

  @BeforeEach
  void setUp() {
    repository = mock(LedgerOutboxRepository.class);
    @SuppressWarnings("unchecked")
    KafkaTemplate<String, String> template = mock(KafkaTemplate.class);
    kafkaTemplate = template;

    relay = new LedgerOutboxRelay(repository, kafkaTemplate, new SimpleMeterRegistry(), null);
    // In production `self` is the Spring transactional proxy; in this unit test point it at the
    // real instance so claimBatch()/persistResult() run their actual logic (the proxy only adds
    // the tx boundary, which there is nothing to assert on here).
    ReflectionTestUtils.setField(relay, "self", relay);
    // @Value fields are not injected in a plain unit test — set them explicitly.
    ReflectionTestUtils.setField(relay, "batchSize", 100);
    ReflectionTestUtils.setField(relay, "maxAttempts", 3);
    ReflectionTestUtils.setField(relay, "sendTimeoutMs", 5000L);
    ReflectionTestUtils.setField(relay, "backoffBaseMs", 2000L);
    ReflectionTestUtils.setField(relay, "backoffMaxMs", 300000L);
    ReflectionTestUtils.setField(relay, "leaseMs", 60000L);
  }

  private LedgerOutbox pendingRow() {
    return LedgerOutbox.builder()
      .id(UUID.randomUUID())
      .aggregateId(UUID.randomUUID())
      .tenantId(UUID.randomUUID())
      .topic("ledger.entry.posted")
      .msgKey(UUID.randomUUID().toString())
      .payload("{\"ok\":true}")
      .status(OutboxStatus.PENDING)
      .attempts(0)
      .availableAt(LocalDateTime.now().minusSeconds(1))
      .build();
  }

  @Test
  @DisplayName("drain marks the row SENT and stamps sentAt when the broker acks")
  void drain_sendSucceeds_marksSent() {
    LedgerOutbox row = pendingRow();
    when(repository.claimDueBatch(eq(OutboxStatus.PENDING.name()), any(LocalDateTime.class), anyInt()))
      .thenReturn(List.of(row));
    when(kafkaTemplate.send(anyString(), anyString(), anyString()))
      .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

    relay.drain();

    assertThat(row.getStatus()).isEqualTo(OutboxStatus.SENT);
    assertThat(row.getSentAt()).isNotNull();
    assertThat(row.getAttempts()).isZero();
    verify(kafkaTemplate).send(row.getTopic(), row.getMsgKey(), row.getPayload());
    // Claim leases the row, then the outcome is persisted per-row via save (not a batch saveAll).
    verify(repository).leaseClaimed(eq(List.of(row.getId())), any(LocalDateTime.class));
    verify(repository).save(row);
  }

  @Test
  @DisplayName("drain on send failure increments attempts, records last_error, stays PENDING (no swallow)")
  void drain_sendFails_retriesAndRecordsError() {
    LedgerOutbox row = pendingRow();
    when(repository.claimDueBatch(eq(OutboxStatus.PENDING.name()), any(LocalDateTime.class), anyInt()))
      .thenReturn(List.of(row));
    when(kafkaTemplate.send(anyString(), anyString(), anyString()))
      .thenReturn(CompletableFuture.failedFuture(new RuntimeException("broker unreachable")));

    relay.drain();

    assertThat(row.getAttempts()).isEqualTo(1);
    assertThat(row.getLastError()).contains("broker unreachable");
    assertThat(row.getStatus()).isEqualTo(OutboxStatus.PENDING);
    assertThat(row.getSentAt()).isNull();
    verify(repository).save(row);
  }

  @Test
  @DisplayName("last_error has CR/LF/tab stripped before persistence (log/record injection)")
  void drain_sendFails_stripsControlChars() {
    LedgerOutbox row = pendingRow();
    when(repository.claimDueBatch(eq(OutboxStatus.PENDING.name()), any(LocalDateTime.class), anyInt()))
      .thenReturn(List.of(row));
    when(kafkaTemplate.send(anyString(), anyString(), anyString()))
      .thenReturn(CompletableFuture.failedFuture(new RuntimeException("bad\r\nINJECTED\tlog")));

    relay.drain();

    assertThat(row.getLastError()).doesNotContain("\r").doesNotContain("\n").doesNotContain("\t");
    assertThat(row.getLastError()).contains("bad__INJECTED_log");
  }

  @Test
  @DisplayName("drain marks FAILED once attempts reach maxAttempts")
  void drain_exhaustsRetries_marksFailed() {
    LedgerOutbox row = pendingRow();
    row.setAttempts(2); // maxAttempts=3, so the next failure is the third
    when(repository.claimDueBatch(eq(OutboxStatus.PENDING.name()), any(LocalDateTime.class), anyInt()))
      .thenReturn(List.of(row));
    when(kafkaTemplate.send(anyString(), anyString(), anyString()))
      .thenReturn(CompletableFuture.failedFuture(new RuntimeException("still down")));

    relay.drain();

    assertThat(row.getAttempts()).isEqualTo(3);
    assertThat(row.getStatus()).isEqualTo(OutboxStatus.FAILED);
  }

  @Test
  @DisplayName("drain on empty claim publishes nothing and leases nothing")
  void drain_emptyClaim_doesNotPublish() {
    when(repository.claimDueBatch(eq(OutboxStatus.PENDING.name()), any(LocalDateTime.class), anyInt()))
      .thenReturn(List.of());

    relay.drain();

    verify(kafkaTemplate, never()).send(anyString(), anyString(), anyString());
    verify(repository, never()).leaseClaimed(anyList(), any(LocalDateTime.class));
    verify(repository, never()).save(any(LedgerOutbox.class));
  }

  @Test
  @DisplayName("drain publishes each claimed row exactly once and persists each independently")
  void drain_publishesEachRowOnce() {
    LedgerOutbox a = pendingRow();
    LedgerOutbox b = pendingRow();
    when(repository.claimDueBatch(eq(OutboxStatus.PENDING.name()), any(LocalDateTime.class), anyInt()))
      .thenReturn(List.of(a, b));
    when(kafkaTemplate.send(anyString(), anyString(), anyString()))
      .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

    relay.drain();

    ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
    verify(kafkaTemplate, times(2)).send(anyString(), keyCaptor.capture(), anyString());
    assertThat(keyCaptor.getAllValues()).containsExactlyInAnyOrder(a.getMsgKey(), b.getMsgKey());
    assertThat(a.getStatus()).isEqualTo(OutboxStatus.SENT);
    assertThat(b.getStatus()).isEqualTo(OutboxStatus.SENT);
    // Per-row persistence, not a single batched saveAll.
    verify(repository).save(a);
    verify(repository).save(b);
  }
}
