package com.baalvion.audit.service;

import com.baalvion.audit.domain.DltMessage;
import com.baalvion.audit.domain.DltMessage.DltStatus;
import com.baalvion.audit.dto.DltMessageResponse;
import com.baalvion.audit.repository.DltMessageRepository;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.header.Header;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Captures dead-lettered records and replays them on demand.
 */
@Slf4j
@Service
@Transactional
public class DltService {

  private final DltMessageRepository repository;
  private final KafkaTemplate<String, String> kafkaTemplate;

  public DltService(DltMessageRepository repository, KafkaTemplate<String, String> kafkaTemplate) {
    this.repository = repository;
    this.kafkaTemplate = kafkaTemplate;
  }

  public void record(ConsumerRecord<String, String> rec) {
    String originalTopic = header(rec, KafkaHeaders.DLT_ORIGINAL_TOPIC);
    if (originalTopic == null) {
      originalTopic = rec.topic().endsWith(".DLT") ? rec.topic().substring(0, rec.topic().length() - 4) : rec.topic();
    }
    String exceptionMessage = header(rec, KafkaHeaders.DLT_EXCEPTION_MESSAGE);

    var dlt = DltMessage.builder()
      .dltTopic(rec.topic())
      .originalTopic(originalTopic)
      .eventKey(rec.key())
      .payload(rec.value() != null ? rec.value() : "{}")
      .exceptionMessage(exceptionMessage)
      .status(DltStatus.DEAD)
      .build();
    repository.save(dlt);
    log.warn("DLT captured: dltTopic={}, originalTopic={}, key={}", rec.topic(), originalTopic, rec.key());
  }

  public DltMessageResponse replay(UUID id, String replayedBy) {
    var dlt = repository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("DLT message not found: " + id));
    if (dlt.getStatus() == DltStatus.REPLAYED) {
      return mapToResponse(dlt);
    }
    kafkaTemplate.send(dlt.getOriginalTopic(), dlt.getEventKey(), dlt.getPayload());
    dlt.setStatus(DltStatus.REPLAYED);
    dlt.setReplayedBy(replayedBy);
    dlt.setReplayedAt(LocalDateTime.now());
    var saved = repository.save(dlt);
    log.info("DLT replayed: id={}, originalTopic={}, by={}", id, dlt.getOriginalTopic(), replayedBy);
    return mapToResponse(saved);
  }

  public DltMessageResponse discard(UUID id, String actor) {
    var dlt = repository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("DLT message not found: " + id));
    dlt.setStatus(DltStatus.DISCARDED);
    dlt.setReplayedBy(actor);
    dlt.setReplayedAt(LocalDateTime.now());
    return mapToResponse(repository.save(dlt));
  }

  @Transactional(readOnly = true)
  public DltMessageResponse get(UUID id) {
    return repository.findById(id)
      .map(this::mapToResponse)
      .orElseThrow(() -> new IllegalArgumentException("DLT message not found: " + id));
  }

  @Transactional(readOnly = true)
  public Page<DltMessageResponse> list(String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<DltMessage> messages = status != null
      ? repository.findByStatus(DltStatus.valueOf(status), pageable)
      : repository.findAllOrdered(pageable);
    return messages.map(this::mapToResponse);
  }

  private String header(ConsumerRecord<String, String> rec, String name) {
    Header h = rec.headers().lastHeader(name);
    return h != null ? new String(h.value(), StandardCharsets.UTF_8) : null;
  }

  private DltMessageResponse mapToResponse(DltMessage d) {
    return DltMessageResponse.builder()
      .id(d.getId())
      .dltTopic(d.getDltTopic())
      .originalTopic(d.getOriginalTopic())
      .eventKey(d.getEventKey())
      .payload(d.getPayload())
      .exceptionMessage(d.getExceptionMessage())
      .status(d.getStatus().name())
      .replayedBy(d.getReplayedBy())
      .replayedAt(d.getReplayedAt())
      .createdAt(d.getCreatedAt())
      .build();
  }
}
