package com.baalvion.risk.health;

import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Dedicated operational view of the sanctions watchlist at {@code /actuator/sanctions}: enforcement mode,
 * overall health, and per-source records / minimum / freshness / last-error. Richer than the health
 * component, for dashboards and on-call diagnosis of feed problems.
 */
@Component
@Endpoint(id = "sanctions")
public class SanctionsEndpoint {

  private final SanctionsStatusReporter reporter;

  public SanctionsEndpoint(SanctionsStatusReporter reporter) {
    this.reporter = reporter;
  }

  @ReadOperation
  public Map<String, Object> sanctions() {
    return reporter.build().toMap();
  }
}
