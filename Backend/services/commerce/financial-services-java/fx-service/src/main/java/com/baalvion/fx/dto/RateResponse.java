package com.baalvion.fx.dto;

import com.baalvion.fx.domain.FxRate;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

@Data
@Builder
public class RateResponse {
  private String baseCurrency;
  private String quoteCurrency;
  private BigDecimal midRate;
  private BigDecimal bidRate;
  private BigDecimal askRate;
  private String source;
  private LocalDateTime asOf;
  private int ttlSeconds;
  private boolean fresh;

  public static RateResponse from(FxRate r) {
    boolean fresh = r.getAsOf() != null
      && Duration.between(r.getAsOf(), LocalDateTime.now()).getSeconds() <= r.getTtlSeconds();
    return RateResponse.builder()
      .baseCurrency(r.getBaseCurrency())
      .quoteCurrency(r.getQuoteCurrency())
      .midRate(r.getMidRate())
      .bidRate(r.getBidRate())
      .askRate(r.getAskRate())
      .source(r.getSource())
      .asOf(r.getAsOf())
      .ttlSeconds(r.getTtlSeconds())
      .fresh(fresh)
      .build();
  }
}
