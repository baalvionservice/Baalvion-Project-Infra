package com.baalvion.audit.kafka;

import com.baalvion.audit.service.DltService;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Monitors every dead-letter topic ({@code *.DLT}) and records the poison messages for
 * inspection/replay. Runs in its own consumer group so it doesn't compete with the audit
 * aggregator. Errors are swallowed so DLT capture can never itself dead-letter.
 */
@Slf4j
@Component
public class DltListener {

  private final DltService dltService;

  public DltListener(DltService dltService) {
    this.dltService = dltService;
  }

  @KafkaListener(
    topicPattern = "${app.dlt.topic-pattern:.*\\.DLT}",
    groupId = "${app.dlt.group-id:audit-dlt-group}"
  )
  public void onDlt(ConsumerRecord<String, String> record) {
    try {
      dltService.record(record);
    } catch (Exception e) {
      log.error("Failed to record DLT message from {} key {}: {}", record.topic(), record.key(), e.getMessage());
    }
  }
}
