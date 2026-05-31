package com.baalvion.risk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One match in the strict external screening contract: {@code { name, source, program? }}.
 * (Distinct from the richer internal {@link ScreeningHit}.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreenMatch {
  /** The watchlist name (primary or alias) that produced the match. */
  private String name;
  /** The source list (e.g. OFAC_SDN, UN_CONSOLIDATED). */
  private String source;
  /** Sanctions program(s), if any (joined). May be null. */
  private String program;
}
