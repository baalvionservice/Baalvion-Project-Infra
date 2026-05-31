package com.baalvion.intelligence.dto;

import com.baalvion.intelligence.provider.IntelligenceProvider.ForecastPoint;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ForecastResponse {
  private UUID id;
  private String commodity;
  private String region;
  private int horizonDays;
  private BigDecimal predictedTotal;
  private String unit;
  private BigDecimal confidence;
  private List<ForecastPoint> points;
  private String provider;
  private LocalDateTime generatedAt;
}
