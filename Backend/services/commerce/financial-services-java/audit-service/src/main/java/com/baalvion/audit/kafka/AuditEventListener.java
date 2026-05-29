package com.baalvion.audit.kafka;

import com.baalvion.audit.service.AuditService;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Aggregates domain events into the audit trail. Subscribes by topic pattern (set via
 * {@code app.audit.topic-pattern}) so any new {domain}.{entity}.{event} topic is picked
 * up automatically. Values are consumed as raw JSON strings (StringDeserializer) and
 * parsed best-effort by {@link AuditService}.
 */
@Slf4j
@Component
public class AuditEventListener {

  private final AuditService auditService;

  public AuditEventListener(AuditService auditService) {
    this.auditService = auditService;
  }

  @KafkaListener(
    // Lowercase-only tail deliberately excludes uppercase `.DLT` topics (full-match).
    topicPattern = "${app.audit.topic-pattern:(payments|ledger|settlement|escrow|account)\\.[a-z.]+}",
    groupId = "${spring.kafka.consumer.group-id:audit-service-group}"
  )
  public void onEvent(ConsumerRecord<String, String> record) {
    try {
      auditService.recordFromEvent(record.topic(), record.key(), record.value());
    } catch (Exception e) {
      // Never let an audit failure stall the consumer; log and move on.
      log.error("Failed to record audit for topic {} key {}: {}", record.topic(), record.key(), e.getMessage());
    }
  }
}
