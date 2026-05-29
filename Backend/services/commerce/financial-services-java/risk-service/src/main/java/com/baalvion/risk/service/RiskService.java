package com.baalvion.risk.service;

import com.baalvion.risk.domain.RiskAssessment;
import com.baalvion.risk.domain.RiskAssessment.Decision;
import com.baalvion.risk.dto.RiskAssessmentResponse;
import com.baalvion.risk.repository.RiskAssessmentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class RiskService {

  private final RiskAssessmentRepository repository;
  private final RiskEngine engine;
  private final KafkaTemplate<String, String> kafkaTemplate;
  private final ObjectMapper objectMapper;

  @Value("${app.risk.velocity-window-minutes:60}")
  private long velocityWindowMinutes;

  public RiskService(RiskAssessmentRepository repository, RiskEngine engine,
                     KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
    this.repository = repository;
    this.engine = engine;
    this.kafkaTemplate = kafkaTemplate;
    this.objectMapper = objectMapper;
  }

  /**
   * Assess a freshly-initiated transaction. Idempotent on transactionId.
   */
  public RiskAssessmentResponse assess(UUID tenantId, UUID transactionId, UUID sourceAccountId,
                                       BigDecimal amount, String currency, String scheme) {
    var existing = repository.findByTenantAndTransaction(tenantId, transactionId);
    if (existing.isPresent()) {
      return mapToResponse(existing.get());
    }

    LocalDateTime windowStart = LocalDateTime.now().minusMinutes(velocityWindowMinutes);
    long recentCount = repository.countRecentBySource(tenantId, sourceAccountId, windowStart);
    BigDecimal recentAmount = repository.sumRecentBySource(tenantId, sourceAccountId, windowStart);

    RiskEngine.Result result = engine.evaluate(amount, recentCount, recentAmount);

    var assessment = RiskAssessment.builder()
      .tenantId(tenantId)
      .transactionId(transactionId)
      .sourceAccountId(sourceAccountId)
      .amount(amount)
      .currency(currency)
      .scheme(scheme)
      .score(result.score())
      .decision(result.decision())
      .reasons(result.reasons())
      .build();
    var saved = repository.save(assessment);

    log.info("Risk assessed: txn={}, tenant={}, decision={}, score={}, reasons={}",
      transactionId, tenantId, result.decision(), result.score(), result.reasons());

    Map<String, Object> event = new HashMap<>();
    event.put("transactionId", transactionId);
    event.put("tenantId", tenantId);
    event.put("decision", result.decision().name());
    event.put("score", result.score());
    event.put("reasons", result.reasons());
    publish("risk.assessment.completed", transactionId.toString(), event);

    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public RiskAssessmentResponse get(UUID tenantId, UUID id) {
    return repository.findByIdAndTenant(id, tenantId)
      .map(this::mapToResponse)
      .orElseThrow(() -> new IllegalArgumentException("Risk assessment not found: " + id));
  }

  @Transactional(readOnly = true)
  public RiskAssessmentResponse getByTransaction(UUID tenantId, UUID transactionId) {
    return repository.findByTenantAndTransaction(tenantId, transactionId)
      .map(this::mapToResponse)
      .orElseThrow(() -> new IllegalArgumentException("Risk assessment not found for transaction: " + transactionId));
  }

  @Transactional(readOnly = true)
  public Page<RiskAssessmentResponse> list(UUID tenantId, String decision, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<RiskAssessment> assessments = decision != null
      ? repository.findByTenantAndDecision(tenantId, Decision.valueOf(decision), pageable)
      : repository.findByTenant(tenantId, pageable);
    return assessments.map(this::mapToResponse);
  }

  private void publish(String topic, String key, Object payload) {
    try {
      kafkaTemplate.send(topic, key, objectMapper.writeValueAsString(payload));
    } catch (Exception e) {
      log.error("Failed to publish {} for {}: {}", topic, key, e.getMessage());
    }
  }

  private RiskAssessmentResponse mapToResponse(RiskAssessment a) {
    return RiskAssessmentResponse.builder()
      .id(a.getId())
      .tenantId(a.getTenantId())
      .transactionId(a.getTransactionId())
      .sourceAccountId(a.getSourceAccountId())
      .amount(a.getAmount())
      .currency(a.getCurrency())
      .scheme(a.getScheme())
      .score(a.getScore())
      .decision(a.getDecision().name())
      .reasons(a.getReasons())
      .createdAt(a.getCreatedAt())
      .build();
  }
}
