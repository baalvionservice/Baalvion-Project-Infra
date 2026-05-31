package com.baalvion.credit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Runs daily delinquency sweeps for invoice finance and BNPL (overdue → default / late fees). */
@Slf4j
@Component
@RequiredArgsConstructor
public class CreditScheduler {

  private final InvoiceFinanceService invoiceFinanceService;
  private final BnplService bnplService;

  @Scheduled(cron = "${app.credit.delinquency-sweep-cron:0 30 1 * * *}")
  public void sweep() {
    try {
      int invoices = invoiceFinanceService.sweepDelinquent();
      int bnpl = bnplService.sweepDelinquent();
      if (invoices > 0 || bnpl > 0) {
        log.info("Credit delinquency sweep: {} invoices, {} BNPL installments updated", invoices, bnpl);
      }
    } catch (Exception e) {
      log.error("Credit delinquency sweep failed: {}", e.getMessage(), e);
    }
  }
}
