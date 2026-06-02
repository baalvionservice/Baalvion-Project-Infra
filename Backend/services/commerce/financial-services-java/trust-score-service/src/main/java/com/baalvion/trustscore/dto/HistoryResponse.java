package com.baalvion.trustscore.dto;

import com.baalvion.trustscore.domain.TrustScoreHistory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Serialized view of one trust-score history entry. */
@Data
@Builder
public class HistoryResponse {

  private UUID id;
  private int score;
  private String band;
  private int delta;
  private String reason;
  private JsonNode factors;
  private String createdBy;
  private LocalDateTime createdAt;

  public static HistoryResponse from(TrustScoreHistory h, ObjectMapper mapper) {
    return HistoryResponse.builder()
      .id(h.getId())
      .score(h.getScore())
      .band(h.getBand() != null ? h.getBand().name() : null)
      .delta(h.getDelta())
      .reason(h.getReason())
      .factors(readJson(h.getFactors(), mapper))
      .createdBy(h.getCreatedBy())
      .createdAt(h.getCreatedAt())
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
