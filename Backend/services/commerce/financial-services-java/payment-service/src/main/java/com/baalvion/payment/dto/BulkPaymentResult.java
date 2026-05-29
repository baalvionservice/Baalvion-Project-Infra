package com.baalvion.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Per-item outcome of a bulk disbursement.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkPaymentResult {
  private String idempotencyKey;
  private String status;        // INITIATED or REJECTED
  private UUID transactionId;   // populated when accepted
  private String error;         // populated when rejected
}
