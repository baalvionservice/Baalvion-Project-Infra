package com.baalvion.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Tenant-wide invoice metrics: invoice counts per status plus outstanding receivable/payable
 * totals and overdue exposure.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceMetricsResponse {
  /** Count of invoices keyed by status name (DRAFT, ISSUED, ... ). */
  private Map<String, Long> countsByStatus;

  private BigDecimal totalOutstandingReceivable;
  private BigDecimal totalOutstandingPayable;

  private long overdueCount;
  private BigDecimal overdueAmount;
}
