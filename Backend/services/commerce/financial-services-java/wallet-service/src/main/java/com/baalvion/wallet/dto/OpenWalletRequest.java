package com.baalvion.wallet.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/** Open a wallet for a holder. Idempotent on (tenant, holderId). */
@Data
public class OpenWalletRequest {

  @NotNull
  private UUID holderId;

  /** USER (default), ORGANIZATION, MERCHANT, PLATFORM. */
  private String holderType;

  private String defaultCurrency;
  private String label;
  private String metadata;
}
