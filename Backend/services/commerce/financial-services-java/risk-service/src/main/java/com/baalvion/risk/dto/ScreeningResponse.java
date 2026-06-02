package com.baalvion.risk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** A sanctions screening result returned to callers. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreeningResponse {
  private UUID id;
  private UUID tenantId;
  private String subjectName;
  private String subjectType;
  private String subjectCountry;
  private String referenceType;
  private String referenceId;
  private String status;
  private BigDecimal topScore;
  private int hitCount;
  private List<ScreeningHit> hits;
  /** Short codes of the jurisdictions screened against (e.g. ["EU","OFAC","UN"]). */
  private List<String> sourcesChecked;
  private String adjudicatedBy;
  private String adjudicationNote;
  private LocalDateTime adjudicatedAt;
  private LocalDateTime createdAt;
}
