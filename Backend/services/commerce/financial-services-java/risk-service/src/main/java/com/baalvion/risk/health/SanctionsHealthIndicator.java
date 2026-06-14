package com.baalvion.risk.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Contributes a {@code sanctions} component to {@code /actuator/health}. Under STRICT enforcement the
 * component (and thus overall health/readiness) reports DOWN when any required watchlist is empty, below
 * its minimum, or stale — so orchestrators stop routing traffic to a node that cannot screen compliantly.
 */
@Component
public class SanctionsHealthIndicator implements HealthIndicator {

  private final SanctionsStatusReporter reporter;

  public SanctionsHealthIndicator(SanctionsStatusReporter reporter) {
    this.reporter = reporter;
  }

  @Override
  public Health health() {
    SanctionsStatusReporter.Report report = reporter.build();
    Health.Builder builder = report.healthy() ? Health.up() : Health.down();
    builder.withDetail("enforcement", report.enforcement().name());

    Map<String, Object> sources = new LinkedHashMap<>();
    for (SanctionsStatusReporter.SourceReport s : report.sources()) {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("records", s.records());
      m.put("minRequired", s.minRequired());
      m.put("meetsMinimum", s.meetsMinimum());
      m.put("ageHours", s.ageHours());
      m.put("stale", s.stale());
      sources.put(s.source(), m);
    }
    builder.withDetail("sources", sources);
    if (!report.issues().isEmpty()) {
      builder.withDetail("issues", report.issues());
    }
    return builder.build();
  }
}
