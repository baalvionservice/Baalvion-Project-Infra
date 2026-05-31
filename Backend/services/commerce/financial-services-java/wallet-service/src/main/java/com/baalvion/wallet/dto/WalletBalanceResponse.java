package com.baalvion.wallet.dto;

import com.baalvion.wallet.domain.WalletBalance;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class WalletBalanceResponse {
  private UUID walletId;
  private String currency;
  private BigDecimal available;
  private BigDecimal held;
  private BigDecimal total;

  public static WalletBalanceResponse from(WalletBalance b) {
    return WalletBalanceResponse.builder()
      .walletId(b.getWalletId())
      .currency(b.getCurrency())
      .available(b.getAvailable())
      .held(b.getHeld())
      .total(b.getAvailable().add(b.getHeld()))
      .build();
  }
}
