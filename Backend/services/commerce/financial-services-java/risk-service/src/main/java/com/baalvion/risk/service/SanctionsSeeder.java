package com.baalvion.risk.service;

import com.baalvion.risk.config.SanctionsProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Loads the active sanctions list on startup when {@code app.sanctions.auto-seed-on-startup} is true
 * and the watchlist is empty, so screening is usable out of the box. Runs as a separate bean (not a
 * self-invocation) so {@link SanctionsService#ingest()} executes within its transaction.
 */
@Slf4j
@Component
public class SanctionsSeeder {

  private final SanctionsService sanctionsService;
  private final SanctionsProperties props;

  public SanctionsSeeder(SanctionsService sanctionsService, SanctionsProperties props) {
    this.sanctionsService = sanctionsService;
    this.props = props;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void seedOnStartup() {
    if (!props.isAutoSeedOnStartup()) {
      return;
    }
    try {
      if (sanctionsService.entityCount() == 0) {
        int n = sanctionsService.ingest();
        log.info("Sanctions watchlist auto-seeded on startup: {} entities (provider='{}')", n, props.getProvider());
      } else {
        log.debug("Sanctions watchlist already populated; skipping auto-seed");
      }
    } catch (Exception e) {
      // Never block startup on a seed failure (e.g. a live provider being unreachable).
      log.error("Sanctions auto-seed failed (continuing without it): {}", e.getMessage());
    }
  }
}
