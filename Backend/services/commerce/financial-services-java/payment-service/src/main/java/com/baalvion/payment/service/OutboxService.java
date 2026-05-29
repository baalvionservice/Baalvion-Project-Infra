package com.baalvion.payment.service;

import com.baalvion.payment.domain.OutboxEvent;
import com.baalvion.payment.domain.OutboxEvent.OutboxStatus;
import com.baalvion.payment.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Writes domain events to the transactional outbox. Called from within a business
 * transaction so the event row commits atomically with the state change.
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
      .eventKey(key)
      .payload(json)
      .status(OutboxStatus.PENDING)
      .attempts(0)
      .build());
    log.debug("Outbox enqueued: topic={}, key={}", topic, key);
  }
}
