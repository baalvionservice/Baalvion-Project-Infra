package com.baalvion.risk.health;

import com.baalvion.risk.config.SanctionsEnforcement;
import com.baalvion.risk.config.SanctionsProperties;
import com.baalvion.risk.config.SanctionsSources;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import com.baalvion.risk.service.SanctionsDatasetStatus;
import com.baalvion.risk.service.SanctionsService;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the per-source sanctions watchlist status used by both {@code SanctionsHealthIndicator} (probe /
 * readiness) and {@code /actuator/sanctions} (ops detail): provider records, whether the configured
 * minimum is met, dataset freshness (age vs {@code dataset-max-age-hours}), and the last ingest error.
 *
 * <p>Under STRICT, the dataset is reported unhealthy if any required source is empty, below its minimum,
 * or stale — so an operator (and Kubernetes readiness) sees a degraded watchlist immediately.
 */
@Component
public class SanctionsStatusReporter {

  private final SanctionsProperties props;
  private final SanctionsService sanctionsService;
  private final SanctionsDatasetStatus datasetStatus;

  public SanctionsStatusReporter(SanctionsProperties props,
                                 SanctionsService sanctionsService,
                                 SanctionsDatasetStatus datasetStatus) {
    this.props = props;
    this.sanctionsService = sanctionsService;
    this.datasetStatus = datasetStatus;
  }

  /** One required source's live status. {@code lastIngestFailed} is a boolean — the raw error text is
   *  kept to the server logs only (see {@code SanctionsService.ingestOne}) so it is never exposed over the
   *  management endpoint. */
  public record SourceReport(
    String source,
    String code,
    long records,
    int minRequired,
    boolean meetsMinimum,
    LocalDateTime lastUpdated,
    Long ageHours,
    boolean stale,
    boolean lastIngestFailed) {
  }

  /** Whole-dataset status: enforcement mode, overall health, and per-source detail with any issues. */
  public record Report(
    SanctionsEnforcement enforcement,
    boolean healthy,
    List<SourceReport> sources,
    List<String> issues) {

    public Map<String, Object> toMap() {
      Map<String, Object> root = new LinkedHashMap<>();
      root.put("enforcement", enforcement.name());
      root.put("healthy", healthy);
      Map<String, Object> bySource = new LinkedHashMap<>();
      for (SourceReport s : sources) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", s.code());
        m.put("records", s.records());
        m.put("minRequired", s.minRequired());
        m.put("meetsMinimum", s.meetsMinimum());
        m.put("lastUpdated", s.lastUpdated());
        m.put("ageHours", s.ageHours());
        m.put("stale", s.stale());
        m.put("lastIngestFailed", s.lastIngestFailed());
        bySource.put(s.source(), m);
      }
      root.put("sources", bySource);
      root.put("issues", issues);
      return root;
    }
  }

  public Report build() {
    SanctionsEnforcement mode = props.getEnforcement();
    boolean strict = mode == SanctionsEnforcement.STRICT;
    long maxAgeHours = props.getDatasetMaxAgeHours();

    List<SourceReport> sources = new ArrayList<>();
    List<String> issues = new ArrayList<>();

    for (String src : props.getRequiredSources()) {
      ListSource ls = SanctionsSources.listSource(src).orElse(null);
      if (ls == null) {
        issues.add("required source '" + src + "' is not a known jurisdiction");
        continue;
      }
      // Read count + freshness in a single read-only transaction so they are mutually consistent (no
      // "0 records but updated 1 minute ago" skew from two separate transactions during an ingest).
      SanctionsService.SourceSnapshotInfo info = sanctionsService.sourceInfo(ls);
      long records = info.count();
      int min = props.getMinEntities().getOrDefault(src.toLowerCase(), 1);
      boolean meetsMin = records >= min;

      LocalDateTime lastUpdated = info.latestUpdate().orElse(null);
      Long ageHours = lastUpdated == null ? null : Duration.between(lastUpdated, LocalDateTime.now()).toHours();
      boolean stale = lastUpdated == null || ageHours > maxAgeHours;

      // Boolean only — the raw provider error string stays in the logs, never on the management endpoint.
      boolean lastIngestFailed = datasetStatus.get(src)
        .map(s -> s.lastError() != null).orElse(false);

      sources.add(new SourceReport(src, ls.code(), records, min, meetsMin, lastUpdated, ageHours, stale, lastIngestFailed));

      if (!meetsMin) {
        issues.add(src + " (" + ls.code() + ") has " + records + " entities, below minimum " + min);
      }
      if (stale) {
        issues.add(src + " (" + ls.code() + ") dataset is stale (age "
          + (ageHours == null ? "unknown" : ageHours + "h") + " > " + maxAgeHours + "h)");
      }
      if (lastIngestFailed) {
        issues.add(src + " (" + ls.code() + ") last ingest FAILED (see service logs)");
      }
    }

    // STRICT: unhealthy if any required source is empty/below-min/stale. PERMISSIVE: informational only.
    boolean healthy = !strict || issues.isEmpty();
    return new Report(mode, healthy, sources, issues);
  }
}
