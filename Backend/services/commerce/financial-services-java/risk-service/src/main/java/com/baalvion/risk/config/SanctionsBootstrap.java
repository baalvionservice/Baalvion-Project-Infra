package com.baalvion.risk.config;

import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import com.baalvion.risk.provider.SanctionsListProvider;
import com.baalvion.risk.service.SanctionsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Boot-time sanctions compliance gate (AML/KYC). Runs during context initialization — i.e. BEFORE the
 * web server binds — so a non-compliant configuration or an unloaded watchlist aborts startup and the
 * process exits non-zero, never serving a single screening request. There is no mock/seed fallback in
 * this flow.
 *
 * <p>Under {@link SanctionsEnforcement#STRICT} (production default) it:
 * <ol>
 *   <li>forbids the development seed provider;</li>
 *   <li>requires every {@code app.sanctions.required-sources} provider to be enabled (missing env/profile
 *       → fail to start);</li>
 *   <li>ensures each required source is loaded and non-empty — reusing fresh durable data on a warm
 *       restart, otherwise fetching synchronously now;</li>
 *   <li>enforces a per-source minimum entity count (catches an empty/partial feed); and</li>
 *   <li>sample-validates that loaded entities are actually screenable end-to-end.</li>
 * </ol>
 * Any failure throws and prevents the application from starting.
 *
 * <p>Under {@link SanctionsEnforcement#PERMISSIVE} (must be set explicitly, for local/dev/test) it only
 * warns if no authoritative list is active. The seed list is permitted.
 */
@Slf4j
@Component
public class SanctionsBootstrap implements SmartInitializingSingleton {

  /** How many loaded entities to sample for the screenability self-check. */
  private static final int SAMPLE_SIZE = 25;

  private final SanctionsProperties props;
  private final List<SanctionsListProvider> providers;
  private final SanctionsService sanctionsService;

  public SanctionsBootstrap(SanctionsProperties props,
                            List<SanctionsListProvider> providers,
                            SanctionsService sanctionsService) {
    this.props = props;
    this.providers = providers;
    this.sanctionsService = sanctionsService;
  }

  @Override
  public void afterSingletonsInstantiated() {
    List<String> activeProviders = providers.stream().map(SanctionsListProvider::name).sorted().toList();

    if (props.getEnforcement() == SanctionsEnforcement.PERMISSIVE) {
      boolean liveActive = activeProviders.stream().anyMatch(n -> !SanctionsSources.isSeed(n));
      if (!liveActive) {
        log.warn("SANCTIONS [PERMISSIVE]: screening is running on the development seed list only "
            + "(active providers: {}). This is NOT an AML/KYC-compliant source and is allowed ONLY because "
            + "app.sanctions.enforcement=permissive. Production must run STRICT.", activeProviders);
      }
      return;
    }

    log.info("SANCTIONS [STRICT]: validating authoritative watchlists before accepting traffic "
      + "(active providers: {}, required: {}).", activeProviders, props.getRequiredSources());

    // (1) The seed list must never be active in production.
    if (activeProviders.stream().anyMatch(SanctionsSources::isSeed)) {
      throw fail("the development 'seed' provider is active. Set app.sanctions.provider to a non-seed "
        + "value (e.g. 'live') so the seed bean is not loaded. Active providers: " + activeProviders);
    }

    // (2) Every required source must be a known jurisdiction AND its provider must be enabled — a missing
    //     env var or profile (e.g. SANCTIONS_UN_ENABLED unset) fails the deployment here.
    for (String src : props.getRequiredSources()) {
      if (SanctionsSources.listSource(src).isEmpty()) {
        throw fail("required source '" + src + "' is not a known authoritative jurisdiction "
          + "(expected one of ofac/un/eu/uk/au). Check app.sanctions.required-sources.");
      }
      if (activeProviders.stream().noneMatch(n -> n.equalsIgnoreCase(src))) {
        throw fail("required sanctions provider '" + src + "' is not enabled. Set "
          + "SANCTIONS_" + src.toUpperCase() + "_ENABLED=true (or run SPRING_PROFILES_ACTIVE=production). "
          + "Active providers: " + activeProviders);
      }
    }

    // (3) Load. Reuse durable last-known-good if it is present and fresh; otherwise fetch synchronously now.
    if (isWarm()) {
      log.info("SANCTIONS [STRICT]: durable watchlist present and fresh (< {}h) — skipping boot fetch.",
        props.getDatasetMaxAgeHours());
    } else {
      log.info("SANCTIONS [STRICT]: cold or stale watchlist — loading from providers now...");
      sanctionsService.ingest();
    }

    // (4) Per-source non-empty + minimum-count sanity check (catches an empty or partially-parsed feed).
    for (String src : props.getRequiredSources()) {
      ListSource ls = SanctionsSources.listSource(src).orElseThrow();
      long count = sanctionsService.entityCount(ls);
      int min = minEntities(src);
      if (count < min) {
        throw fail("source '" + src + "' (" + ls.code() + ") loaded " + count + " active entities, below the "
          + "required minimum of " + min + ". The feed is empty, unreachable with no last-known-good data, "
          + "or failed to parse. Refusing to start.");
      }
      log.info("SANCTIONS [STRICT]: {} ({}) OK — {} active entities (>= {}).", src, ls.code(), count, min);
    }

    // (5) Sample validation: prove the loaded data is actually screenable end-to-end (not just rows present).
    int matched = sanctionsService.sampleSelfMatch(SAMPLE_SIZE);
    if (matched == 0) {
      throw fail("boot sample validation failed — none of the sampled loaded entities screened against their "
        + "own name. The normalize/match pipeline or the loaded data is corrupt.");
    }

    log.info("SANCTIONS [STRICT]: watchlist READY — {} active entities, {} sampled entities screenable.",
      sanctionsService.entityCount(), matched);
  }

  /** All required sources are loaded above their minimum AND updated within the freshness window. */
  private boolean isWarm() {
    LocalDateTime cutoff = LocalDateTime.now().minusHours(props.getDatasetMaxAgeHours());
    for (String src : props.getRequiredSources()) {
      ListSource ls = SanctionsSources.listSource(src).orElse(null);
      if (ls == null) {
        return false;
      }
      if (sanctionsService.entityCount(ls) < minEntities(src)) {
        return false;
      }
      LocalDateTime latest = sanctionsService.latestUpdate(ls).orElse(null);
      if (latest == null || latest.isBefore(cutoff)) {
        return false;
      }
    }
    return true;
  }

  private int minEntities(String src) {
    return props.getMinEntities().getOrDefault(src.toLowerCase(), 1);
  }

  private static IllegalStateException fail(String why) {
    return new IllegalStateException("SANCTIONS COMPLIANCE FAIL-SAFE (STRICT enforcement): " + why);
  }
}
