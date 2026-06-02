package com.baalvion.wallet.dto;

import com.baalvion.wallet.domain.WalletEntry;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WalletEntryResponse {
  private UUID id;
  private UUID walletId;
  private String currency;
  private String direction;
  private String entryType;
  private BigDecimal amount;
  private BigDecimal balanceAfter;
  private String reference;
  private UUID relatedEntryId;
  private String createdBy;
  private LocalDateTime createdAt;

  public static WalletEntryResponse from(WalletEntry e) {
    return WalletEntryResponse.builder()
      .id(e.getId())
      .walletId(e.getWalletId())
      .currency(e.getCurrency())
      .direction(e.getDirection() != null ? e.getDirection().name() : null)
      .entryType(e.getEntryType() != null ? e.getEntryType().name() : null)
      .amount(e.getAmount())
      .balanceAfter(e.getBalanceAfter())
      .reference(e.getReference())
      .relatedEntryId(e.getRelatedEntryId())
      .createdBy(e.getCreatedBy())
      .createdAt(e.getCreatedAt())
      .build();
  }
}
