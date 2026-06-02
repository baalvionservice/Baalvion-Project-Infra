package com.baalvion.intelligence.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/** Anonymised market benchmark (BTI) for a commodity/region. */
@Data
@Builder
public class BenchmarkResponse {
  private String commodity;
  private String region;
  private BigDecimal median;
  private BigDecimal p25;
  private BigDecimal p75;
  private int sampleSize;
  private String currency;
  private String unit;
  private String provider;
}
