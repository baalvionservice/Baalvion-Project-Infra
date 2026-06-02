package com.baalvion.fx.dto;

import com.baalvion.fx.domain.FxForward;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ForwardResponse {
  private UUID id;
  private UUID tenantId;
  private String sellCurrency;
  private String buyCurrency;
  private BigDecimal notionalAmount;
  private BigDecimal spotRateAtBook;
  private BigDecimal forwardRate;
  private BigDecimal forwardPoints;
  private BigDecimal buyAmount;
  private LocalDate valueDate;
  private int tenorDays;
  private BigDecimal marginRate;
  private BigDecimal marginAmount;
  private String status;
  private String createdBy;
  private LocalDateTime createdAt;
  private LocalDateTime settledAt;

  public static ForwardResponse from(FxForward f) {
    return ForwardResponse.builder()
      .id(f.getId())
      .tenantId(f.getTenantId())
      .sellCurrency(f.getSellCurrency())
      .buyCurrency(f.getBuyCurrency())
      .notionalAmount(f.getNotionalAmount())
      .spotRateAtBook(f.getSpotRateAtBook())
      .forwardRate(f.getForwardRate())
      .forwardPoints(f.getForwardPoints())
      .buyAmount(f.getBuyAmount())
      .valueDate(f.getValueDate())
      .tenorDays(f.getTenorDays())
      .marginRate(f.getMarginRate())
      .marginAmount(f.getMarginAmount())
      .status(f.getStatus() != null ? f.getStatus().name() : null)
      .createdBy(f.getCreatedBy())
      .createdAt(f.getCreatedAt())
      .settledAt(f.getSettledAt())
      .build();
  }
}
