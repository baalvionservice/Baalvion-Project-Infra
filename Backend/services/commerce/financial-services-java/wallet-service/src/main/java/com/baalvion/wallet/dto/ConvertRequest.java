package com.baalvion.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Convert funds between two currency balances of the same wallet at a supplied rate (typically a
 * firm rate obtained from the FX service / a rate-lock). buyAmount = sellAmount * rate.
 */
@Data
public class ConvertRequest {

  private String idempotencyKey;

  @NotBlank
  @Size(min = 3, max = 3)
  private String sellCurrency;

  @NotBlank
  @Size(min = 3, max = 3)
  private String buyCurrency;

  @NotNull
  @DecimalMin(value = "0.0001", message = "sellAmount must be positive")
  private BigDecimal sellAmount;

  @NotNull
  @DecimalMin(value = "0.00000001", message = "rate must be positive")
  private BigDecimal rate;

  /** Optional reference to the originating FX rate-lock / conversion. */
  private UUID fxReferenceId;

  private String reference;
}
