package com.baalvion.fx.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Expires lapsed rate-locks on a short interval so stale quotes are never executable. */
@Slf4j
@Component
@RequiredArgsConstructor
public class FxScheduler {

  private final FxDealService dealService;

  @Scheduled(fixedDelayString = "${app.fx.lock-sweep-ms:30000}")
  public void expireLocks() {
    try {
      dealService.expireLocks();
    } catch (Exception e) {
      log.error("FX rate-lock expiry sweep failed: {}", e.getMessage(), e);
    }
  }
}
