package com.baalvion.tradefinance.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sweeps operative instruments past their expiry date to a terminal EXPIRED state. Runs hourly;
 * each run is transactional inside the respective service so partial failure never corrupts state.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiryScheduler {

  private final LetterOfCreditService letterOfCreditService;
  private final BankGuaranteeService bankGuaranteeService;

  @Scheduled(cron = "${app.trade-finance.expiry-sweep-cron:0 5 * * * *}")
  public void sweepExpired() {
    try {
      int lc = letterOfCreditService.expireOverdue();
      int bg = bankGuaranteeService.expireOverdue();
      if (lc > 0 || bg > 0) {
        log.info("Expiry sweep complete: {} credits, {} guarantees expired", lc, bg);
      }
    } catch (Exception e) {
      log.error("Expiry sweep failed: {}", e.getMessage(), e);
    }
  }
}
