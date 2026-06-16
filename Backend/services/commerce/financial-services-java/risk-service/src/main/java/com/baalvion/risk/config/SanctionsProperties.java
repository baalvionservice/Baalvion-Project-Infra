package com.baalvion.risk.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Typed, bounds-validated configuration for sanctions screening ({@code app.sanctions}).
 * {@code @Validated} makes a misconfiguration (e.g. a threshold &gt; 1 or {@code maxHits} of 0) fail
 * fast at startup with a clear message, rather than silently corrupting screening verdicts at runtime.
 */
@Data
@Component
@Validated
@ConfigurationProperties(prefix = "app.sanctions")
public class SanctionsProperties {

  /** Active list provider id ("seed" by default; "ofac"/"un"/"eu" for live downloaders). */
  @NotBlank
  private String provider = "seed";

  /**
   * Compliance safety posture (decoupled from {@code app.security.enabled}). {@code STRICT} (default) is
   * production: authoritative OFAC/UN/EU lists must be loaded and non-empty at boot or the service refuses
   * to start, the seed list is forbidden, and screening fails closed on an empty watchlist. {@code
   * PERMISSIVE} (must be set explicitly) is for local/dev/test and allows the offline seed list.
   */
  @NotNull
  private SanctionsEnforcement enforcement = SanctionsEnforcement.STRICT;

  /**
   * Authoritative provider ids that MUST be enabled, loaded, and non-empty under {@code STRICT}
   * enforcement. Boot fails if any is missing or empty. (Provider ids, not jurisdiction codes.)
   */
  @NotEmpty
  private List<@NotBlank String> requiredSources = new ArrayList<>(List.of("ofac", "un", "eu"));

  /**
   * Per-source minimum active-entity count for the boot-time sanity check (catches a feed that returned
   * empty or parsed to near-nothing). Keyed by provider id. Conservative defaults sit well below real list
   * sizes (OFAC ~17k, UN ~700, EU ~2k) yet well above a broken/partial parse.
   */
  private Map<String, Integer> minEntities = new HashMap<>(Map.of(
    "ofac", 1000, "un", 100, "eu", 500, "uk", 50, "au", 50));

  /** Max age (hours) of a source's data before it is considered STALE by the health check. */
  @Min(value = 1, message = "dataset-max-age-hours must be >= 1")
  private long datasetMaxAgeHours = 48;

  /** Names scoring at/above this are recorded as hits and flag a POTENTIAL_MATCH (0–1). */
  @DecimalMin(value = "0.0", message = "match-threshold must be >= 0")
  @DecimalMax(value = "1.0", message = "match-threshold must be <= 1")
  private BigDecimal matchThreshold = new BigDecimal("0.85");

  /** A hit at/above this is treated as a CONFIRMED_MATCH (auto-block) without manual review (0–1). */
  @DecimalMin(value = "0.0", message = "auto-block-threshold must be >= 0")
  @DecimalMax(value = "1.0", message = "auto-block-threshold must be <= 1")
  private BigDecimal autoBlockThreshold = new BigDecimal("0.95");

  /** Max hits retained per screening (top-scoring). */
  @Min(value = 1, message = "max-hits must be >= 1")
  private int maxHits = 10;

  /** Load the seed/provider list automatically on startup if the table is empty. */
  private boolean autoSeedOnStartup = true;

  /** TTL (seconds) of the in-memory active-watchlist snapshot used by screening (the DB is the durable cache). */
  @Min(value = 1, message = "cache-ttl-seconds must be >= 1")
  private long cacheTtlSeconds = 300;

  /** Periodic watchlist refresh from the active provider. */
  private Refresh refresh = new Refresh();

  /** Live OFAC SDN provider settings (used when ofac.enabled=true, or legacy provider=ofac). */
  private Ofac ofac = new Ofac();

  /** Live EU Consolidated list provider settings (used when eu.enabled=true). */
  private Eu eu = new Eu();

  /** Live UN Consolidated list provider settings (used when un.enabled=true). */
  private Un un = new Un();

  /**
   * Per-source reliability weights applied to a raw match score to produce the per-match
   * {@code sourceConfidence}. NOTE: these weight the displayed confidence, NOT the block verdict —
   * the verdict stays on the raw name-match score so a strong UN/EU hit is never down-weighted below
   * the block threshold (a safety-critical compliance choice).
   */
  private Map<String, Double> sourceWeights = new HashMap<>(Map.of(
    "OFAC", 1.0, "EU", 0.9, "UN", 0.85, "UK", 0.9, "AU", 0.85));

  /** Weight for any source not in {@link #sourceWeights}. */
  private double defaultSourceWeight = 0.8;

  @Data
  public static class Refresh {
    /** Master switch for all scheduled provider refresh jobs. */
    private boolean enabled = true;
    /** Legacy single-refresh cron (kept for back-compat; per-provider crons live on each provider). */
    private String cron = "0 0 3 * * *";
  }

  @Data
  public static class Ofac {
    /** Enable the OFAC provider bean + ingestion. */
    private boolean enabled = false;
    /** OFAC SDN primary-name + program + type feed (CSV). */
    private String sdnUrl = "https://www.treasury.gov/ofac/downloads/sdn.csv";
    /** OFAC alternate-name (alias / a.k.a.) feed (CSV). */
    private String altUrl = "https://www.treasury.gov/ofac/downloads/alt.csv";
    /** OFAC address feed (CSV) — used to derive country. */
    private String addUrl = "https://www.treasury.gov/ofac/downloads/add.csv";
    @Min(1)
    private int connectTimeoutMs = 10_000;
    @Min(1)
    private int readTimeoutMs = 60_000;
    @Min(1)
    private int maxRetries = 3;
    @Min(0)
    private long retryBackoffMs = 2_000;
    /** External-provider rate-limit guard: do not re-fetch the feeds more often than this. */
    @Min(0)
    private long minRefreshIntervalMinutes = 60;
    /** Scheduled refresh cron (default daily 03:00 — OFAC publishes ~daily). */
    private String cron = "0 0 3 * * *";
  }

  @Data
  public static class Eu {
    /** Enable the EU provider bean + ingestion. */
    private boolean enabled = false;
    /** EU Consolidated Financial Sanctions List (FSD XML, full list). */
    private String url = "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw";
    @Min(1)
    private int connectTimeoutMs = 10_000;
    @Min(1)
    private int readTimeoutMs = 60_000;
    @Min(1)
    private int maxRetries = 3;
    @Min(0)
    private long retryBackoffMs = 2_000;
    @Min(0)
    private long minRefreshIntervalMinutes = 60;
    /** Scheduled refresh cron (default daily 03:30). */
    private String cron = "0 30 3 * * *";
  }

  @Data
  public static class Un {
    /** Enable the UN provider bean + ingestion. */
    private boolean enabled = false;
    /** UN Security Council Consolidated List (XML). */
    private String url = "https://scsanctions.un.org/resources/xml/en/consolidated.xml";
    @Min(1)
    private int connectTimeoutMs = 10_000;
    @Min(1)
    private int readTimeoutMs = 60_000;
    @Min(1)
    private int maxRetries = 3;
    @Min(0)
    private long retryBackoffMs = 2_000;
    /** UN updates more frequently; guard re-fetch to no more than ~2h. */
    @Min(0)
    private long minRefreshIntervalMinutes = 120;
    /** Scheduled refresh cron (default every 4h — within the 2–6h target). */
    private String cron = "0 0 */4 * * *";
  }
}
