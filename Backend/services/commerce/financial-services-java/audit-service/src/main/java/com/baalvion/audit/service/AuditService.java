package com.baalvion.audit.service;

import com.baalvion.audit.domain.AuditLog;
import com.baalvion.audit.dto.AuditEventResponse;
import com.baalvion.audit.dto.RecordEventRequest;
import com.baalvion.audit.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@Transactional
public class AuditService {

  private static final UUID SYSTEM_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000000");

  private final AuditLogRepository repository;
  private final ObjectMapper objectMapper;
  private final com.baalvion.audit.search.AuditSearchPort searchPort;
  private final com.baalvion.audit.webhook.WebhookService webhookService;

  public AuditService(AuditLogRepository repository, ObjectMapper objectMapper,
                      com.baalvion.audit.search.AuditSearchPort searchPort,
                      com.baalvion.audit.webhook.WebhookService webhookService) {
    this.repository = repository;
    this.objectMapper = objectMapper;
    this.searchPort = searchPort;
    this.webhookService = webhookService;
  }

  public AuditEventResponse record(UUID tenantId, String traceId, RecordEventRequest request) {
    var entry = AuditLog.builder()
      .tenantId(tenantId)
      .eventType(request.getEventType())
      .aggregateType(request.getAggregateType())
      .aggregateId(request.getAggregateId())
      .action(request.getAction())
      .actor(request.getActor())
      .source(request.getSource() != null ? request.getSource() : "api")
      .traceId(traceId)
      .payload(normalizePayload(request.getPayload()))
      .build();

    var saved = repository.save(entry);
    searchPort.index(saved);
    log.info("Audit recorded: id={}, tenant={}, eventType={}, source={}", saved.getId(), tenantId, saved.getEventType(), saved.getSource());
    return mapToResponse(saved);
  }

  /**
   * Records an event observed on Kafka. Tenant and aggregate are extracted from the
   * event body on a best-effort basis.
   */
  public void recordFromEvent(String topic, String key, String payloadJson) {
    UUID tenantId = SYSTEM_TENANT;
    String aggregateId = key;
    String traceId = null;
    try {
      JsonNode node = objectMapper.readTree(payloadJson);
      if (node.hasNonNull("tenantId")) {
        tenantId = UUID.fromString(node.get("tenantId").asText());
      }
      if (node.hasNonNull("id")) {
        aggregateId = node.get("id").asText();
      } else if (node.hasNonNull("aggregateId")) {
        aggregateId = node.get("aggregateId").asText();
      }
      if (node.hasNonNull("traceId")) {
        traceId = node.get("traceId").asText();
      }
    } catch (Exception e) {
      log.warn("Could not parse event payload from topic {}: {}", topic, e.getMessage());
    }

    var entry = AuditLog.builder()
      .tenantId(tenantId)
      .eventType(topic)
      .aggregateId(aggregateId)
      .source("kafka")
      .traceId(traceId)
      .payload(normalizePayload(payloadJson))
      .build();

    var saved = repository.save(entry);
    searchPort.index(saved);
    // Fan out the durably-recorded event to matching webhook subscriptions (HMAC-signed).
    webhookService.fanOut(saved.getTenantId(), saved.getEventType(), saved.getPayload());
    log.debug("Audit recorded from Kafka: topic={}, tenant={}, aggregateId={}", topic, tenantId, aggregateId);
  }

  @Transactional(readOnly = true)
  public AuditEventResponse getEvent(UUID tenantId, UUID id) {
    var entry = repository.findByIdAndTenant(id, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Audit entry not found: " + id));
    return mapToResponse(entry);
  }

  @Transactional(readOnly = true)
  public Page<AuditEventResponse> listEvents(UUID tenantId, String eventType, String aggregateId, String actor, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<AuditLog> entries;
    if (eventType != null) {
      entries = repository.findByTenantAndEventType(tenantId, eventType, pageable);
    } else if (aggregateId != null) {
      entries = repository.findByTenantAndAggregateId(tenantId, aggregateId, pageable);
    } else if (actor != null) {
      entries = repository.findByTenantAndActor(tenantId, actor, pageable);
    } else {
      entries = repository.findByTenant(tenantId, pageable);
    }
    return entries.map(this::mapToResponse);
  }

  /** Ensures the stored payload is valid JSON; wraps non-JSON text as a string node. */
  private String normalizePayload(String payload) {
    if (payload == null || payload.isBlank()) {
      return "{}";
    }
    try {
      objectMapper.readTree(payload);
      return payload;
    } catch (Exception e) {
      try {
        return objectMapper.writeValueAsString(java.util.Map.of("raw", payload));
      } catch (Exception ignored) {
        return "{}";
      }
    }
  }

  private AuditEventResponse mapToResponse(AuditLog a) {
    return AuditEventResponse.builder()
      .id(a.getId())
      .tenantId(a.getTenantId())
      .eventType(a.getEventType())
      .aggregateType(a.getAggregateType())
      .aggregateId(a.getAggregateId())
      .action(a.getAction())
      .actor(a.getActor())
      .source(a.getSource())
      .traceId(a.getTraceId())
      .payload(a.getPayload())
      .createdAt(a.getCreatedAt())
      .build();
  }
}
