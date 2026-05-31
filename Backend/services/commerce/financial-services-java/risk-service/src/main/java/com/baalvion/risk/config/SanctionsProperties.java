package com.baalvion.risk.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;

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

  /** Live OFAC SDN provider settings (used when provider=ofac). */
  private Ofac ofac = new Ofac();

  @Data
  public static class Refresh {
    /** Enable the scheduled refresh job. */
    private boolean enabled = true;
    /** Spring cron for the refresh (default daily 03:00). */
    private String cron = "0 0 3 * * *";
  }

  @Data
  public static class Ofac {
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
  }
}
