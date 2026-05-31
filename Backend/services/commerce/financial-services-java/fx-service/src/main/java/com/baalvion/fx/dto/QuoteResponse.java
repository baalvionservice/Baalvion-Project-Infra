package com.baalvion.fx.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** An indicative (non-binding) conversion quote at the current dealable rate. */
@Data
@Builder
public class QuoteResponse {
  private String sellCurrency;
  private String buyCurrency;
  private BigDecimal sellAmount;
  private BigDecimal buyAmount;
  private BigDecimal rate;
  private LocalDateTime asOf;
}
