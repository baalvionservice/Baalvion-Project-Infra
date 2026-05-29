package com.baalvion.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {
  private UUID id;
  private UUID tenantId;
  private String accountNumber;
  private String accountName;
  private String accountType;
  private String currency;
  private BigDecimal balance;
  private BigDecimal ledgerBalance;
  private String kycStatus;
  private BigDecimal dailyLimit;
  private String metadata;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
