package com.baalvion.fx.dto;

import com.baalvion.fx.domain.FxConversion;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ConversionResponse {
  private UUID id;
  private UUID tenantId;
  private String sellCurrency;
  private String buyCurrency;
  private BigDecimal sellAmount;
  private BigDecimal buyAmount;
  private BigDecimal rate;
  private String dealType;
  private UUID rateLockId;
  private UUID forwardId;
  private String status;
  private String createdBy;
  private LocalDateTime createdAt;

  public static ConversionResponse from(FxConversion c) {
    return ConversionResponse.builder()
      .id(c.getId())
      .tenantId(c.getTenantId())
      .sellCurrency(c.getSellCurrency())
      .buyCurrency(c.getBuyCurrency())
      .sellAmount(c.getSellAmount())
      .buyAmount(c.getBuyAmount())
      .rate(c.getRate())
      .dealType(c.getDealType() != null ? c.getDealType().name() : null)
      .rateLockId(c.getRateLockId())
      .forwardId(c.getForwardId())
      .status(c.getStatus() != null ? c.getStatus().name() : null)
      .createdBy(c.getCreatedBy())
      .createdAt(c.getCreatedAt())
      .build();
  }
}
