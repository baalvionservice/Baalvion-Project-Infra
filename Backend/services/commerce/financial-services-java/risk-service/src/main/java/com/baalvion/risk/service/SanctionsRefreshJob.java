package com.baalvion.risk.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Per-provider scheduled watchlist refresh. Each jurisdiction is refreshed on its own cron and is
 * fail-isolated ({@link SanctionsService#ingestProvider} swallows + logs failures and keeps the
 * last-known-good data), so one feed being down never affects the others or the screening path.
 * A provider that is not enabled is a no-op. Default crons never fire during a test run.
 *
 * <ul>
 *   <li>OFAC — daily (publishes ~daily)</li>
 *   <li>EU   — daily</li>
 *   <li>UN   — every 4h (within the 2–6h target; the provider's own rate-limit guard caps actual fetches)</li>
 * </ul>
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.sanctions.refresh.enabled", havingValue = "true", matchIfMissing = true)
public class SanctionsRefreshJob {

  private final SanctionsService sanctionsService;

  public SanctionsRefreshJob(SanctionsService sanctionsService) {
    this.sanctionsService = sanctionsService;
  }

  @Scheduled(cron = "${app.sanctions.ofac.cron:0 0 3 * * *}")
  public void refreshOfac() {
    refresh("ofac");
  }

  @Scheduled(cron = "${app.sanctions.eu.cron:0 30 3 * * *}")
  public void refreshEu() {
    refresh("eu");
  }

  @Scheduled(cron = "${app.sanctions.un.cron:0 0 */4 * * *}")
  public void refreshUn() {
    refresh("un");
  }

  private void refresh(String provider) {
    int n = sanctionsService.ingestProvider(provider);
    if (n > 0) {
      log.info("Scheduled '{}' sanctions refresh complete: {} entities", provider, n);
    }
  }
}
