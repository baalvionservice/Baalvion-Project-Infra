package com.baalvion.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * AR/AP aging summary. Buckets the outstanding amount (total - amountPaid) of unpaid invoices
 * by how far past their due date they are. Invoices with no due date, or not yet due, fall in
 * the {@code current} bucket.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgingSummaryResponse {
  private String direction;            // RECEIVABLE | PAYABLE
  private String currency;             // present only when all buckets share one currency, else null

  private BigDecimal current;          // not yet due / no due date
  private BigDecimal days1To30;        // 1-30 days past due
  private BigDecimal days31To60;       // 31-60 days past due
  private BigDecimal days61To90;       // 61-90 days past due
  private BigDecimal days90Plus;       // 90+ days past due

  private BigDecimal totalOutstanding; // sum of all buckets
  private long invoiceCount;           // number of unpaid invoices considered
}
