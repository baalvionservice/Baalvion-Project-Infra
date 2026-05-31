package com.baalvion.aml.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/** A transaction to screen against the AML monitoring rules. */
@Data
public class ScreenRequest {

  /** Dedup key — repeat screens with the same key return the original alert. */
  private String idempotencyKey;

  private UUID subjectId;
  private String subjectName;
  private String transactionId;

  /** INBOUND or OUTBOUND. */
  private String direction;

  @NotNull(message = "amount is required")
  @PositiveOrZero(message = "amount must be >= 0")
  private BigDecimal amount;

  @NotNull(message = "currency is required")
  @Size(min = 3, max = 3, message = "currency must be an ISO-4217 code")
  private String currency;

  /** ISO 3166-1 alpha-2 counterparty country, used for FATF jurisdiction rules. */
  @Size(max = 2)
  private String counterpartyCountry;

  /** Optional velocity signals supplied by the caller (computed in its own ledger). */
  private Integer recentTxCount;
  private BigDecimal recentTxTotal;

  /** Free-form context persisted with the alert. */
  private Map<String, Object> details;
}
