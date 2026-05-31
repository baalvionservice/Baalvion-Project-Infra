package com.baalvion.risk.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodic watchlist refresh — re-ingests from the active {@link com.baalvion.risk.provider.SanctionsListProvider}
 * (the live OFAC feed when {@code app.sanctions.provider=ofac}) on the configured cron so the local
 * cache stays current. Default cron is daily 03:00 (so it never fires during a test run); the OFAC
 * provider's own rate-limit guard prevents over-fetching. Failures are logged and never propagate.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.sanctions.refresh.enabled", havingValue = "true", matchIfMissing = true)
public class SanctionsRefreshJob {

  private final SanctionsService sanctionsService;

  public SanctionsRefreshJob(SanctionsService sanctionsService) {
    this.sanctionsService = sanctionsService;
  }

  @Scheduled(cron = "${app.sanctions.refresh.cron:0 0 3 * * *}")
  public void refresh() {
    try {
      int n = sanctionsService.ingest();
      log.info("Scheduled sanctions watchlist refresh complete: {} active entities", n);
    } catch (Exception e) {
      // Never let a refresh failure (e.g. the external feed being down) escalate.
      log.error("Scheduled sanctions watchlist refresh failed: {}", e.getMessage());
    }
  }
}
