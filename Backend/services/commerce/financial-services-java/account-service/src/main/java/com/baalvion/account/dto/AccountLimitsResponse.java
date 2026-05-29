package com.baalvion.account.dto;

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
public class AccountLimitsResponse {
  private UUID accountId;
  private String currency;
  private BigDecimal dailyLimit;
  private BigDecimal availableBalance;
  private String kycStatus;
  /** True when the account is allowed to transact (KYC APPROVED and not suspended). */
  private boolean transactable;
}
