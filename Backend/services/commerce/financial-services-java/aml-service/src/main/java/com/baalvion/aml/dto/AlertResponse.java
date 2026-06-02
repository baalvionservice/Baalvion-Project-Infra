package com.baalvion.aml.dto;

import com.baalvion.aml.domain.AmlAlert;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Serialized view of an AML alert. */
@Data
@Builder
public class AlertResponse {

  private UUID id;
  private String reference;
  private UUID subjectId;
  private String subjectName;
  private String transactionId;
  private String direction;
  private BigDecimal amount;
  private String currency;
  private String counterpartyCountry;
  private BigDecimal riskScore;
  private String riskGrade;
  private JsonNode triggeredRules;
  private String status;
  private String findings;
  private String assignedTo;
  private JsonNode details;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private LocalDateTime resolvedAt;

  public static AlertResponse from(AmlAlert a, ObjectMapper mapper) {
    return AlertResponse.builder()
      .id(a.getId())
      .reference(a.getReference())
      .subjectId(a.getSubjectId())
      .subjectName(a.getSubjectName())
      .transactionId(a.getTransactionId())
      .direction(a.getDirection())
      .amount(a.getAmount())
      .currency(a.getCurrency())
      .counterpartyCountry(a.getCounterpartyCountry())
      .riskScore(a.getRiskScore())
      .riskGrade(a.getRiskGrade() != null ? a.getRiskGrade().name() : null)
      .triggeredRules(readJson(a.getTriggeredRules(), mapper))
      .status(a.getStatus() != null ? a.getStatus().name() : null)
      .findings(a.getFindings())
      .assignedTo(a.getAssignedTo())
      .details(readJson(a.getDetails(), mapper))
      .createdAt(a.getCreatedAt())
      .updatedAt(a.getUpdatedAt())
      .resolvedAt(a.getResolvedAt())
      .build();
  }

  private static JsonNode readJson(String raw, ObjectMapper mapper) {
    try {
      return mapper.readTree(raw == null || raw.isBlank() ? "null" : raw);
    } catch (Exception e) {
      return null;
    }
  }
}
