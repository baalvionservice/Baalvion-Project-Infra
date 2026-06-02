package com.baalvion.wallet.dto;

import com.baalvion.wallet.domain.WalletHold;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class HoldResponse {
  private UUID id;
  private UUID walletId;
  private String currency;
  private BigDecimal amount;
  private String status;
  private String reference;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
  private LocalDateTime resolvedAt;

  public static HoldResponse from(WalletHold h) {
    return HoldResponse.builder()
      .id(h.getId())
      .walletId(h.getWalletId())
      .currency(h.getCurrency())
      .amount(h.getAmount())
      .status(h.getStatus() != null ? h.getStatus().name() : null)
      .reference(h.getReference())
      .createdAt(h.getCreatedAt())
      .expiresAt(h.getExpiresAt())
      .resolvedAt(h.getResolvedAt())
      .build();
  }
}
