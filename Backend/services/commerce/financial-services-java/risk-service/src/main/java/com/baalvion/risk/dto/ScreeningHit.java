package com.baalvion.risk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** One watchlist match within a screening result; serialized into the screening's {@code hits} jsonb. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreeningHit {
  private UUID entityId;
  private String listSource;
  private String entityType;
  /** The specific name (primary or alias) that produced the score. */
  private String matchedName;
  private BigDecimal score;
  private List<String> programs;
  private List<String> countries;
}
