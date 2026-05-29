package com.baalvion.payment.dto;

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
public class TransactionResponse {
  private UUID id;
  private UUID tenantId;
  private String idempotencyKey;
  private UUID sourceAccountId;
  private UUID destinationAccountId;
  private BigDecimal amount;
  private BigDecimal fee;
  private BigDecimal vat;
  private String currency;
  private String paymentScheme;
  private String status;
  private UUID ledgerJournalId;
  private String schemeRef;
  private String initiatedBy;
  private String metadata;
  private String failureReason;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
