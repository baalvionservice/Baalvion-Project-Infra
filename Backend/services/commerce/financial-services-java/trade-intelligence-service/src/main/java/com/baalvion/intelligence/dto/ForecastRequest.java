package com.baalvion.intelligence.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Request a demand forecast for a commodity (optionally scoped to a region/horizon). */
@Data
public class ForecastRequest {

  @NotBlank
  private String commodity;

  private String region;

  /** Forecast horizon in days; defaults to the configured horizon when null/0. */
  private Integer horizonDays;
}
