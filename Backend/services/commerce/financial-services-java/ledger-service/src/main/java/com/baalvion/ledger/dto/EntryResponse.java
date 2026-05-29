package com.baalvion.ledger.dto;

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
public class EntryResponse {
  private UUID id;
  private UUID tenantId;
  private String transactionRef;
  private UUID debitAccountId;
  private UUID creditAccountId;
  private BigDecimal amount;
  private String currency;
  private String entryType;
  private String status;
  private String description;
  private LocalDateTime postedAt;
  private LocalDateTime reversedAt;
  private String metadata;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
