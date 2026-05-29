package com.baalvion.ledger.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountBalanceResponse {
  private UUID accountId;
  private BigDecimal debits;
  private BigDecimal credits;
  private BigDecimal balance;
  private boolean balanced;
}
