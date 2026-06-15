package com.baalvion.invoice.service;

import com.baalvion.invoice.domain.OutboxEvent;
import com.baalvion.invoice.domain.OutboxEvent.OutboxStatus;
import com.baalvion.invoice.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Writes invoice domain events to the transactional outbox. Called from WITHIN an InvoiceService
 * business transaction so the event row commits atomically with the invoice state change — the
 * event can no longer be lost when the broker is down or the process dies, the way the previous
 * inline fire-and-forget {@code kafkaTemplate.send} allowed.
 */
@Slf4j
@Service
public class OutboxService {

  private final OutboxEventRepository repository;
  private final ObjectMapper objectMapper;

  public OutboxService(OutboxEventRepository repository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  /**
   * Enqueue an event onto the outbox. MUST be called inside the caller's @Transactional method so
   * the row commits with the domain mutation. Serialization failure throws (the whole transaction
   * rolls back) rather than silently dropping the event.
   *
   * <p>{@code Propagation.MANDATORY} enforces this contract at runtime: if a future caller invokes
   * {@code enqueue} outside an active transaction it fails fast (no silent write without the
   * atomicity guarantee) instead of relying on caller discipline.
   */
  @Transactional(propagation = Propagation.MANDATORY)
  public void enqueue(UUID tenantId, String topic, String key, Object payload) {
    String json;
    try {
      json = objectMapper.writeValueAsString(payload);
    } catch (Exception e) {
      throw new IllegalStateException("Unable to serialize outbox payload for topic " + topic, e);
    }
    repository.save(OutboxEvent.builder()
      .tenantId(tenantId)
      .topic(topic)
      .msgKey(key)
      .payload(json)
      .status(OutboxStatus.PENDING)
      .attempts(0)
      .build());
    log.debug("Outbox enqueued: topic={}, key={}", topic, key);
  }
}
