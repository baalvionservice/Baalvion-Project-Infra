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
  /** Internal list source enum name (e.g. OFAC_SDN, UN_CONSOLIDATED). */
  private String listSource;
  /** Short jurisdiction code for the external contract (OFAC | EU | UN | UK | AU). */
  private String source;
  private String entityType;
  /** The specific name (primary or alias) that produced the score. */
  private String matchedName;
  /** Raw name-match score in [0,1] (drives the verdict). */
  private BigDecimal score;
  /** Raw score weighted by the source's reliability (additive; does not change the verdict). */
  private BigDecimal sourceConfidence;
  /** Cross-source dedup key (links the same logical entity across OFAC/EU/UN). */
  private String mergeKey;
  private List<String> programs;
  private List<String> countries;
}
