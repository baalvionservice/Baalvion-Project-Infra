package com.baalvion.fx.dto;

import com.baalvion.fx.domain.FxRateLock;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RateLockResponse {
  private UUID id;
  private UUID tenantId;
  private String sellCurrency;
  private String buyCurrency;
  private BigDecimal sellAmount;
  private BigDecimal buyAmount;
  private BigDecimal lockedRate;
  private String status;
  private String createdBy;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
  private LocalDateTime executedAt;

  public static RateLockResponse from(FxRateLock l) {
    return RateLockResponse.builder()
      .id(l.getId())
      .tenantId(l.getTenantId())
      .sellCurrency(l.getSellCurrency())
      .buyCurrency(l.getBuyCurrency())
      .sellAmount(l.getSellAmount())
      .buyAmount(l.getBuyAmount())
      .lockedRate(l.getLockedRate())
      .status(l.getStatus() != null ? l.getStatus().name() : null)
      .createdBy(l.getCreatedBy())
      .createdAt(l.getCreatedAt())
      .expiresAt(l.getExpiresAt())
      .executedAt(l.getExecutedAt())
      .build();
  }
}
