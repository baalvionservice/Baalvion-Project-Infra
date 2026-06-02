package com.baalvion.intelligence.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class NlQueryResponse {
  private String intent;       // DEMAND_FORECAST, SUPPLIER_RISK, SEARCH
  private String commodity;
  private String action;
  private Map<String, Object> filters;
  private String answer;
  private String provider;
}
