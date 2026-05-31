package com.baalvion.risk.provider;

import com.baalvion.risk.config.SanctionsProperties;
import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Live OFAC SDN provider (gap G3). Fetches the official U.S. Treasury OFAC Specially Designated
 * Nationals feeds — {@code sdn.csv} (primary name, type, program), {@code alt.csv} (aliases / a.k.a.),
 * {@code add.csv} (addresses → country) — and joins them by entity number into the internal
 * {@link SanctionsListRecord} schema (id, name, aliases, country, program). Active only when
 * {@code app.sanctions.provider=ofac}.
 *
 * <p>Production hardening: per-feed connect/read timeouts, bounded retry with linear backoff, and a
 * rate-limit guard ({@code min-refresh-interval-minutes}) that serves the last fetched snapshot rather
 * than hammering the external feed. The matching engine and DB ingest are unchanged — this only swaps
 * the data source.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.sanctions.provider", havingValue = "ofac")
public class OfacSdnProvider implements SanctionsListProvider {

  private final SanctionsProperties props;
  private final RestClient restClient;

  // Rate-limit / fetch-throttle cache (per instance).
  private volatile List<SanctionsListRecord> cached;
  private volatile long lastFetchEpochMs;

  public OfacSdnProvider(SanctionsProperties props) {
    this.props = props;
    SanctionsProperties.Ofac ofac = props.getOfac();
    // The OFAC feeds 302-redirect (treasury.gov → presigned S3); use the JDK HttpClient with explicit
    // redirect-following (NORMAL = follow https→https, never downgrade to http) + a connect timeout.
    HttpClient httpClient = HttpClient.newBuilder()
      .followRedirects(HttpClient.Redirect.NORMAL)
      .connectTimeout(Duration.ofMillis(ofac.getConnectTimeoutMs()))
      .build();
    JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
    rf.setReadTimeout(Duration.ofMillis(ofac.getReadTimeoutMs()));
    this.restClient = RestClient.builder().requestFactory(rf).build();
  }

  @Override
  public String name() {
    return "ofac";
  }

  @Override
  public synchronized List<SanctionsListRecord> fetch() {
    SanctionsProperties.Ofac ofac = props.getOfac();
    long minIntervalMs = ofac.getMinRefreshIntervalMinutes() * 60_000L;
    long age = System.currentTimeMillis() - lastFetchEpochMs;
    if (cached != null && age < minIntervalMs) {
      log.info("OFAC fetch throttled (last fetch {}s ago < {}min); serving {} cached records",
        age / 1000, ofac.getMinRefreshIntervalMinutes(), cached.size());
      return cached;
    }

    String sdn = get(ofac.getSdnUrl());
    String alt = get(ofac.getAltUrl());
    String add = get(ofac.getAddUrl());
    List<SanctionsListRecord> records = parse(sdn, alt, add);

    this.cached = records;
    this.lastFetchEpochMs = System.currentTimeMillis();
    log.info("OFAC SDN fetched: {} entities (sdn {}B, alt {}B, add {}B)",
      records.size(), len(sdn), len(alt), len(add));
    return records;
  }

  // ----------------------------------------------------------------- fetch with retry/timeout

  private String get(String url) {
    int max = Math.max(1, props.getOfac().getMaxRetries());
    long backoff = props.getOfac().getRetryBackoffMs();
    RuntimeException last = null;
    for (int attempt = 1; attempt <= max; attempt++) {
      try {
        String body = restClient.get().uri(url).retrieve().body(String.class);
        if (body == null || body.isBlank()) {
          throw new IllegalStateException("empty body from " + url);
        }
        return body;
      } catch (RuntimeException e) {
        last = e;
        log.warn("OFAC fetch attempt {}/{} failed for {}: {}", attempt, max, url, e.getMessage());
        if (attempt < max && backoff > 0) {
          try {
            Thread.sleep(backoff * attempt);
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            break;
          }
        }
      }
    }
    throw new IllegalStateException("OFAC feed unavailable after " + max + " attempts: " + url, last);
  }

  // ----------------------------------------------------------------- parse + join (testable seam)

  /**
   * Join the three OFAC CSV feeds into internal records. Package-private and pure so it can be
   * unit-tested with inline CSV samples (no network).
   */
  List<SanctionsListRecord> parse(String sdnCsv, String altCsv, String addCsv) {
    // ent_num -> aliases / countries
    Map<String, List<String>> aliases = new LinkedHashMap<>();
    for (List<String> r : SanctionsCsv.parse(altCsv)) {
      // alt.csv: ent_num, alt_num, alt_type, alt_name, alt_remarks
      String ent = at(r, 0);
      String altName = at(r, 3);
      if (ent != null && altName != null) {
        aliases.computeIfAbsent(ent, k -> new ArrayList<>()).add(altName);
      }
    }
    Map<String, LinkedHashSet<String>> countries = new LinkedHashMap<>();
    for (List<String> r : SanctionsCsv.parse(addCsv)) {
      // add.csv: ent_num, add_num, address, city/state/postal, country, remarks
      String ent = at(r, 0);
      String country = at(r, 4);
      if (ent != null && country != null) {
        countries.computeIfAbsent(ent, k -> new LinkedHashSet<>()).add(country);
      }
    }

    List<SanctionsListRecord> records = new ArrayList<>();
    for (List<String> r : SanctionsCsv.parse(sdnCsv)) {
      // sdn.csv: ent_num, SDN_Name, SDN_Type, Program, Title, ... , Remarks
      String ent = at(r, 0);
      String sdnName = at(r, 1);
      if (ent == null || sdnName == null) {
        continue;
      }
      records.add(SanctionsListRecord.builder()
        .listSource(ListSource.OFAC_SDN)
        .externalId(ent)
        .entityType(mapType(at(r, 2)))
        .primaryName(sdnName)
        .aliases(aliases.getOrDefault(ent, List.of()))
        .programs(splitProgram(at(r, 3)))
        .countries(countries.containsKey(ent) ? new ArrayList<>(countries.get(ent)) : List.of())
        .remarks(at(r, 11))
        .build());
    }
    return records;
  }

  private static String at(List<String> row, int i) {
    return (row != null && i < row.size()) ? row.get(i) : null;
  }

  private static EntityType mapType(String sdnType) {
    if (sdnType == null) return EntityType.OTHER;
    return switch (sdnType.trim().toLowerCase()) {
      case "individual" -> EntityType.INDIVIDUAL;
      case "entity" -> EntityType.ORGANIZATION;
      case "vessel" -> EntityType.VESSEL;
      case "aircraft" -> EntityType.AIRCRAFT;
      default -> EntityType.OTHER;
    };
  }

  /** OFAC programs come as "SDGT" or compound "IRAN] [SDGT" / "X; Y" — split into a clean list. */
  private static List<String> splitProgram(String program) {
    if (program == null || program.isBlank()) {
      return List.of();
    }
    List<String> out = new ArrayList<>();
    for (String p : program.split("\\]\\s*\\[|;")) {
      String t = p.replace("[", "").replace("]", "").trim();
      if (!t.isEmpty()) {
        out.add(t);
      }
    }
    return out;
  }

  private static int len(String s) {
    return s == null ? 0 : s.length();
  }
}
