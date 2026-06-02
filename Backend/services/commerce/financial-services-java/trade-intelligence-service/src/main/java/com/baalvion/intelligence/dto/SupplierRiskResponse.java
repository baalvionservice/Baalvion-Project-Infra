package com.baalvion.intelligence.dto;

import com.baalvion.intelligence.domain.SupplierRisk;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class SupplierRiskResponse {
  private UUID id;
  private UUID supplierId;
  private String supplierName;
  private BigDecimal score;
  private String grade;
  private boolean earlyWarning;
  private Map<String, Object> factors;
  private String summary;
  private String provider;
  private LocalDateTime assessedAt;

  @SuppressWarnings("unchecked")
  public static SupplierRiskResponse from(SupplierRisk r, ObjectMapper mapper) {
    Map<String, Object> factors = Map.of();
    try { if (r.getFactors() != null) factors = mapper.readValue(r.getFactors(), Map.class); } catch (Exception ignored) {}
    return SupplierRiskResponse.builder()
      .id(r.getId()).supplierId(r.getSupplierId()).supplierName(r.getSupplierName())
      .score(r.getScore()).grade(r.getGrade() != null ? r.getGrade().name() : null)
      .earlyWarning(r.isEarlyWarning()).factors(factors).summary(r.getSummary())
      .provider(r.getProvider()).assessedAt(r.getAssessedAt())
      .build();
  }
}
