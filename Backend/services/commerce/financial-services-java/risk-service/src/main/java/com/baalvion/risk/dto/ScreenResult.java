package com.baalvion.risk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Strict external screening contract returned by {@code POST /api/v1/sanctions/screen}:
 * <pre>{ status, confidence, matches: [{ name, source, program? }] }</pre>
 * This is the public/UI-facing shape; the internal {@link ScreeningResponse} (id, tenant, hit detail,
 * adjudication, audit fields) is what gets persisted and returned by the management endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenResult {

  /** CLEAR | POTENTIAL_MATCH | CONFIRMED_MATCH (adjudication states are internal). */
  private String status;

  /** Top match confidence in [0,1]. */
  private BigDecimal confidence;

  private List<ScreenMatch> matches;

  /** Map the internal screening response onto the strict external contract. */
  public static ScreenResult from(ScreeningResponse r) {
    List<ScreenMatch> matches = r.getHits() == null ? List.of()
      : r.getHits().stream()
          .map(h -> ScreenMatch.builder()
            .name(h.getMatchedName())
            .source(h.getListSource())
            .program(h.getPrograms() == null || h.getPrograms().isEmpty()
              ? null : String.join(", ", h.getPrograms()))
            .build())
          .toList();
    // The adjudication states (FALSE_POSITIVE/BLOCKED) never arise on a fresh screen, but normalize
    // any non-screen status to the three contract values defensively.
    String status = switch (r.getStatus()) {
      case "CONFIRMED_MATCH", "BLOCKED" -> "CONFIRMED_MATCH";
      case "POTENTIAL_MATCH" -> "POTENTIAL_MATCH";
      default -> "CLEAR";
    };
    return ScreenResult.builder()
      .status(status)
      .confidence(r.getTopScore())
      .matches(matches)
      .build();
  }
}
