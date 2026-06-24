package com.baalvion.payment.service;

import com.baalvion.payment.domain.OutboxEvent;
import com.baalvion.payment.domain.OutboxEvent.OutboxStatus;
import com.baalvion.payment.repository.OutboxEventRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Drains the transactional outbox to Kafka. Runs on a fixed delay; PENDING rows are claimed
 * with {@code FOR UPDATE SKIP LOCKED} (safe across replicas), published as their stored JSON,
 * and marked SENT. Failures increment an attempt counter and stay PENDING until
 * {@code max-attempts}, then FAILED. Exposes an {@code outbox.pending} gauge for alerting.
 */
@Slf4j
@Service
public class OutboxPublisher {

  private final OutboxEventRepository repository;

  /**
   * Nullable: when {@code app.kafka.enabled=false} the Kafka wiring backs off and no
   * {@link KafkaTemplate} bean is provided, so {@link #drain()} short-circuits and outbox rows stay
   * durably PENDING (republished once Kafka is re-enabled — at-least-once is preserved).
   */
  @Nullable
  private final KafkaTemplate<String, String> kafkaTemplate;

  private final boolean kafkaEnabled;

  @Value("${app.outbox.batch-size:100}")
  private int batchSize;

  @Value("${app.outbox.max-attempts:10}")
  private int maxAttempts;

  public OutboxPublisher(OutboxEventRepository repository,
                         @Nullable KafkaTemplate<String, String> kafkaTemplate,
                         MeterRegistry meterRegistry,
                         @Value("${app.kafka.enabled:true}") boolean kafkaEnabled) {
    this.repository = repository;
    this.kafkaTemplate = kafkaTemplate;
    this.kafkaEnabled = kafkaEnabled;
    Gauge.builder("outbox.pending", repository, r -> (double) r.countByStatus(OutboxStatus.PENDING))
      .description("Outbox events awaiting publication")
      .register(meterRegistry);
    // FAILED rows are recoverable (see recoverFailed) but must be VISIBLE: alert on a sustained
    // non-zero value, which means events are repeatedly failing to publish (e.g. a poison payload).
    Gauge.builder("outbox.failed", repository, r -> (double) r.countByStatus(OutboxStatus.FAILED))
      .description("Outbox events that exhausted retries and are awaiting recovery")
      .register(meterRegistry);
  }

  @Scheduled(fixedDelayString = "${app.outbox.poll-ms:2000}")
  @Transactional
  public void drain() {
    // Kafka disabled (or no template wired): leave rows PENDING — they are durable and will be
    // republished once Kafka is re-enabled. Never claim/mark rows we cannot actually publish.
    if (!kafkaEnabled || kafkaTemplate == null) {
      return;
    }
    // FOR UPDATE SKIP LOCKED: safe for many concurrent publisher replicas.
    List<OutboxEvent> pending = repository.lockPendingBatch(OutboxStatus.PENDING.name(), batchSize);
    if (pending.isEmpty()) {
      return;
    }
    for (OutboxEvent event : pending) {
      try {
        kafkaTemplate.send(event.getTopic(), event.getEventKey(), event.getPayload()).get(10, TimeUnit.SECONDS);
        event.setStatus(OutboxStatus.SENT);
        event.setSentAt(LocalDateTime.now());
      } catch (Exception e) {
        event.setAttempts(event.getAttempts() + 1);
        event.setLastError(e.getMessage());
        if (event.getAttempts() >= maxAttempts) {
          event.setStatus(OutboxStatus.FAILED);
          log.error("Outbox event {} exhausted retries ({}), marking FAILED: {}", event.getId(), maxAttempts, e.getMessage());
        } else {
          log.warn("Outbox publish failed (attempt {}): topic={}, key={}: {}", event.getAttempts(), event.getTopic(), event.getEventKey(), e.getMessage());
        }
      }
    }
    repository.saveAll(pending);
  }

  /**
   * Safety net for events that exhausted {@code max-attempts} — e.g. a Kafka outage longer than the
   * tight drain retry window would otherwise strand a captured-payment event in FAILED forever, with
   * no republication and permanent ledger divergence risk.
   *
   * <p>On a slow cadence (default 5 min — a cool-off so we don't thrash during an ongoing outage)
   * this re-queues FAILED rows back to PENDING with a fresh attempt budget, so the normal {@link
   * #drain()} pipeline republishes them. The drain logic itself is untouched. {@code lastError} is
   * retained for forensics. Republication is safe under the platform's at-least-once contract:
   * downstream consumers (ledger {@code postPaymentSaga}, {@code PaymentSagaListener}) dedupe on
   * transactionId and the producer runs with {@code enable.idempotence=true}, so an event is never
   * double-applied. Reuses {@code lockPendingBatch} (FOR UPDATE SKIP LOCKED) so it is replica-safe
   * and cannot contend with a concurrent drain on the same row.
   */
  @Scheduled(fixedDelayString = "${app.outbox.recover-ms:300000}")
  @Transactional
  public void recoverFailed() {
    List<OutboxEvent> failed = repository.lockPendingBatch(OutboxStatus.FAILED.name(), batchSize);
    if (failed.isEmpty()) {
      return;
    }
    for (OutboxEvent event : failed) {
      event.setStatus(OutboxStatus.PENDING);
      event.setAttempts(0); // fresh window; without this the drain would re-FAIL on the first error
    }
    repository.saveAll(failed);
    log.warn("Outbox recovery: re-queued {} FAILED event(s) for republication", failed.size());
  }
}
