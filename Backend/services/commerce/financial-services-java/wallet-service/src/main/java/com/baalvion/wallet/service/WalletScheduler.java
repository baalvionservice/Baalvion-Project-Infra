package com.baalvion.wallet.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Auto-releases expired holds so reserved funds are never stranded. */
@Slf4j
@Component
@RequiredArgsConstructor
public class WalletScheduler {

  private final WalletService walletService;

  @Scheduled(fixedDelayString = "${app.wallet.hold-sweep-ms:60000}")
  public void expireHolds() {
    try {
      walletService.expireHolds();
    } catch (Exception e) {
      log.error("Wallet hold expiry sweep failed: {}", e.getMessage(), e);
    }
  }
}
