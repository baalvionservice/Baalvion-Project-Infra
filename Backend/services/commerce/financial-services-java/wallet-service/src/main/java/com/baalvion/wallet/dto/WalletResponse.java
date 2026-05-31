package com.baalvion.wallet.dto;

import com.baalvion.wallet.domain.Wallet;
import com.baalvion.wallet.domain.WalletBalance;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class WalletResponse {
  private UUID id;
  private UUID tenantId;
  private UUID holderId;
  private String holderType;
  private String status;
  private String defaultCurrency;
  private String label;
  private String createdBy;
  private String metadata;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private List<WalletBalanceResponse> balances;

  public static WalletResponse from(Wallet w) {
    return from(w, null);
  }

  public static WalletResponse from(Wallet w, List<WalletBalance> balances) {
    return WalletResponse.builder()
      .id(w.getId())
      .tenantId(w.getTenantId())
      .holderId(w.getHolderId())
      .holderType(w.getHolderType() != null ? w.getHolderType().name() : null)
      .status(w.getStatus() != null ? w.getStatus().name() : null)
      .defaultCurrency(w.getDefaultCurrency())
      .label(w.getLabel())
      .createdBy(w.getCreatedBy())
      .metadata(w.getMetadata())
      .createdAt(w.getCreatedAt())
      .updatedAt(w.getUpdatedAt())
      .balances(balances != null ? balances.stream().map(WalletBalanceResponse::from).toList() : null)
      .build();
  }
}
