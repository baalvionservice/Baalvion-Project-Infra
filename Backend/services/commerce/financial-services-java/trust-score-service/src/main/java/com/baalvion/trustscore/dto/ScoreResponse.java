package com.baalvion.trustscore.dto;

import com.baalvion.trustscore.domain.TrustScore;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Serialized view of a subject's current trust score. */
@Data
@Builder
public class ScoreResponse {

  private UUID id;
  private UUID subjectId;
  private String subjectType;
  private String subjectName;
  private int score;
  private String band;
  private int revision;
  private JsonNode factors;
  private JsonNode signals;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static ScoreResponse from(TrustScore t, ObjectMapper mapper) {
    return ScoreResponse.builder()
      .id(t.getId())
      .subjectId(t.getSubjectId())
      .subjectType(t.getSubjectType())
      .subjectName(t.getSubjectName())
      .score(t.getScore())
      .band(t.getBand() != null ? t.getBand().name() : null)
      .revision(t.getRevision())
      .factors(readJson(t.getFactors(), mapper))
      .signals(readJson(t.getSignals(), mapper))
      .createdAt(t.getCreatedAt())
      .updatedAt(t.getUpdatedAt())
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
