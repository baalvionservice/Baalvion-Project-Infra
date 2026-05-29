package com.baalvion.escrow.dto;

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
public class EscrowResponse {
  private UUID id;
  private UUID tenantId;
  private String escrowRef;
  private UUID sourceAccountId;
  private UUID beneficiaryAccountId;
  private BigDecimal amount;
  private String currency;
  private String status;
  private String releaseCondition;
  private LocalDateTime releaseAt;
  private boolean autoReleaseOnExpiry;
  private LocalDateTime releasedAt;
  private LocalDateTime refundedAt;
  private String disputeReason;
  private UUID ledgerJournalId;
  private String metadata;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
