package com.baalvion.dispute.service;

import com.baalvion.dispute.domain.OutboxEvent;
import com.baalvion.dispute.domain.OutboxEvent.OutboxStatus;
import com.baalvion.dispute.repository.OutboxEventRepository;
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

/** Drains the transactional outbox to Kafka (FOR UPDATE SKIP LOCKED, retry → FAILED). */
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
      .description("Dispute outbox events awaiting publication")
      .register(meterRegistry);
  }

  @Scheduled(fixedDelayString = "${app.outbox.poll-ms:2000}")
  @Transactional
  public void drain() {
    List<OutboxEvent> pending = repository.lockPendingBatch(OutboxStatus.PENDING.name(), batchSize);
    if (pending.isEmpty()) return;
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
          log.error("Outbox event {} exhausted retries, marking FAILED: {}", event.getId(), e.getMessage());
        } else {
          log.warn("Outbox publish failed (attempt {}): topic={}: {}", event.getAttempts(), event.getTopic(), e.getMessage());
        }
      }
    }
    repository.saveAll(pending);
  }
}
