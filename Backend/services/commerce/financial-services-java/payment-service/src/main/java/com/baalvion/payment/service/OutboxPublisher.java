package com.baalvion.payment.service;

import com.baalvion.payment.domain.OutboxEvent;
import com.baalvion.payment.domain.OutboxEvent.OutboxStatus;
import com.baalvion.payment.repository.OutboxEventRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
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
  private final KafkaTemplate<String, String> kafkaTemplate;

  @Value("${app.outbox.batch-size:100}")
  private int batchSize;

  @Value("${app.outbox.max-attempts:10}")
  private int maxAttempts;

  public OutboxPublisher(OutboxEventRepository repository, KafkaTemplate<String, String> kafkaTemplate, MeterRegistry meterRegistry) {
    this.repository = repository;
    this.kafkaTemplate = kafkaTemplate;
    Gauge.builder("outbox.pending", repository, r -> (double) r.countByStatus(OutboxStatus.PENDING))
      .description("Outbox events awaiting publication")
      .register(meterRegistry);
  }

  @Scheduled(fixedDelayString = "${app.outbox.poll-ms:2000}")
  @Transactional
  public void drain() {
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
}
