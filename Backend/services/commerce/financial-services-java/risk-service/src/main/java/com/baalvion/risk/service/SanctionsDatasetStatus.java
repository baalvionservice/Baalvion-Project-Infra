package com.baalvion.risk.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Live, per-source ingest telemetry for the sanctions watchlist — the freshness/health signal surfaced by
 * {@code SanctionsHealthIndicator} and {@code /actuator/sanctions}. Updated by {@link SanctionsService}
 * on every ingest attempt so operators can see, per provider, when it last loaded, how many records, and
 * the last error (if the external feed is failing while last-known-good data is still being served).
 */
@Component
public class SanctionsDatasetStatus {

  /** Immutable snapshot of one provider's last ingest outcome. */
  public record SourceStatus(
    String source,
    long records,
    Instant lastAttempt,
    Instant lastSuccess,
    String lastError) {
  }

  private final Map<String, SourceStatus> bySource = new ConcurrentHashMap<>();

  public void recordAttempt(String source) {
    bySource.compute(source, (k, prev) -> new SourceStatus(
      source,
      prev == null ? 0 : prev.records(),
      Instant.now(),
      prev == null ? null : prev.lastSuccess(),
      prev == null ? null : prev.lastError()));
  }

  public void recordSuccess(String source, long records) {
    Instant now = Instant.now();
    bySource.put(source, new SourceStatus(source, records, now, now, null));
  }

  public void recordFailure(String source, String error) {
    bySource.compute(source, (k, prev) -> new SourceStatus(
      source,
      prev == null ? 0 : prev.records(),
      Instant.now(),
      prev == null ? null : prev.lastSuccess(),
      error));
  }

  public Optional<SourceStatus> get(String source) {
    return Optional.ofNullable(bySource.get(source));
  }

  public Map<String, SourceStatus> snapshot() {
    return Map.copyOf(bySource);
  }
}
