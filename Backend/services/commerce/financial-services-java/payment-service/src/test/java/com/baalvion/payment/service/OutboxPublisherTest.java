package com.baalvion.payment.service;

import com.baalvion.payment.domain.OutboxEvent;
import com.baalvion.payment.domain.OutboxEvent.OutboxStatus;
import com.baalvion.payment.repository.OutboxEventRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * PR2 (P1): an outbox event that exhausts max-attempts (e.g. a Kafka outage longer than the tight
 * drain window) must NOT be abandoned in FAILED forever. {@code recoverFailed} re-queues FAILED rows
 * to PENDING with a fresh budget so the normal pipeline republishes them, and an {@code outbox.failed}
 * gauge makes the condition visible. The existing drain logic is unchanged.
 */
@ExtendWith(MockitoExtension.class)
class OutboxPublisherTest {

  @Mock private OutboxEventRepository repository;
  @Mock private KafkaTemplate<String, String> kafkaTemplate;

  private SimpleMeterRegistry registry;
  private OutboxPublisher publisher;

  @BeforeEach
  void setUp() {
    registry = new SimpleMeterRegistry();
    publisher = new OutboxPublisher(repository, kafkaTemplate, registry);
    ReflectionTestUtils.setField(publisher, "batchSize", 100);
    ReflectionTestUtils.setField(publisher, "maxAttempts", 10);
  }

  private static OutboxEvent event(OutboxStatus status, int attempts) {
    return OutboxEvent.builder()
      .id(UUID.randomUUID())
      .tenantId(UUID.randomUUID())
      .topic("payments.transaction.completed")
      .eventKey("txn-1")
      .payload("{\"transactionId\":\"txn-1\"}")
      .status(status)
      .attempts(attempts)
      .build();
  }

  @Test
  void registersTheOutboxFailedGauge() {
    assertThat(registry.find("outbox.failed").gauge()).isNotNull();
  }

  @Test
  void kafkaOutageDrivesAnExhaustedEventToFailed() {
    OutboxEvent e = event(OutboxStatus.PENDING, 9); // one more failure crosses max-attempts (10)
    when(repository.lockPendingBatch(eq(OutboxStatus.PENDING.name()), anyInt())).thenReturn(List.of(e));
    when(kafkaTemplate.send(anyString(), anyString(), anyString()))
      .thenReturn(CompletableFuture.<SendResult<String, String>>failedFuture(new RuntimeException("kafka down")));

    publisher.drain();

    assertThat(e.getStatus()).isEqualTo(OutboxStatus.FAILED);
    assertThat(e.getAttempts()).isEqualTo(10);
    verify(repository).saveAll(List.of(e));
  }

  @Test
  void recoveryRequeuesFailedEventsToPendingWithAFreshBudget() {
    OutboxEvent failed = event(OutboxStatus.FAILED, 10);
    when(repository.lockPendingBatch(eq(OutboxStatus.FAILED.name()), anyInt())).thenReturn(List.of(failed));

    publisher.recoverFailed();

    assertThat(failed.getStatus()).isEqualTo(OutboxStatus.PENDING);
    assertThat(failed.getAttempts()).isZero();
    verify(repository).saveAll(List.of(failed));
  }

  @Test
  void recoveryIsANoOpWhenNothingHasFailed() {
    when(repository.lockPendingBatch(eq(OutboxStatus.FAILED.name()), anyInt())).thenReturn(List.of());

    publisher.recoverFailed();

    verify(repository, org.mockito.Mockito.never()).saveAll(org.mockito.ArgumentMatchers.anyList());
  }

  @Test
  void fullLoop_outageThenRecovery_returnsEventToThePublishPipeline() {
    OutboxEvent e = event(OutboxStatus.PENDING, 9);
    // Outage: drain pushes the event past max-attempts into FAILED.
    when(repository.lockPendingBatch(eq(OutboxStatus.PENDING.name()), anyInt())).thenReturn(List.of(e));
    lenient().when(kafkaTemplate.send(anyString(), anyString(), anyString()))
      .thenReturn(CompletableFuture.<SendResult<String, String>>failedFuture(new RuntimeException("kafka down")));
    publisher.drain();
    assertThat(e.getStatus()).isEqualTo(OutboxStatus.FAILED);

    // Kafka is back: recovery re-queues the same row to PENDING so the next drain republishes it.
    when(repository.lockPendingBatch(eq(OutboxStatus.FAILED.name()), anyInt())).thenReturn(List.of(e));
    publisher.recoverFailed();
    assertThat(e.getStatus()).isEqualTo(OutboxStatus.PENDING);
    assertThat(e.getAttempts()).isZero();
  }
}
