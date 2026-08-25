package com.baalvion.wallet.dto;

import com.baalvion.wallet.domain.WalletDeposit;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class DepositStatusResponse {
  private UUID depositId;
  private String status;
  private BigDecimal amount;
  private String currency;
  private String fulfillmentError;

  public static DepositStatusResponse from(WalletDeposit d) {
    return DepositStatusResponse.builder()
      .depositId(d.getId())
      .status(d.getStatus())
      .amount(d.getAmount())
      .currency(d.getCurrency())
      .fulfillmentError(d.getFulfillmentError())
      .build();
  }
}
