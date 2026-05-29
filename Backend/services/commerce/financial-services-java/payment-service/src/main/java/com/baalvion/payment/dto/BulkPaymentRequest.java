package com.baalvion.payment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Bulk disbursement request (payroll / batch transfers) — design §3.2 POST /payments/bulk.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkPaymentRequest {

  @NotEmpty(message = "At least one payment item is required")
  @Valid
  private List<InitiatePaymentRequest> items;
}
