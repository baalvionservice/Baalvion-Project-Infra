package com.baalvion.tradefinance.service;

import com.baalvion.tradefinance.domain.OutboxEvent;
import com.baalvion.tradefinance.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Writes domain events to the transactional outbox in the SAME DB transaction as the business
 * change. A separate {@link OutboxPublisher} drains them to Kafka.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxService {

  private final OutboxEventRepository outboxRepository;
  private final ObjectMapper objectMapper;

  public void enqueue(UUID tenantId, String topic, String eventKey, Object payload) {
    try {
      String json = objectMapper.writeValueAsString(payload);
      OutboxEvent event = OutboxEvent.builder()
        .tenantId(tenantId)
        .topic(topic)
        .eventKey(eventKey)
        .payload(json)
        .build();
      outboxRepository.save(event);
      log.debug("Outbox enqueued: topic={}, key={}", topic, eventKey);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Failed to serialize outbox payload for topic " + topic, e);
    }
  }
}
