package com.baalvion.risk.config;

import com.baalvion.risk.domain.SanctionedEntity.ListSource;

import java.util.Map;
import java.util.Optional;

/**
 * Maps a {@link com.baalvion.risk.provider.SanctionsListProvider} id (e.g. {@code "ofac"}) to the
 * {@link ListSource} its records carry. Used by the boot-time compliance validation and health checks to
 * count and freshness-check loaded data per authoritative source.
 */
public final class SanctionsSources {

  /** Provider id reserved for the non-compliant development seed list. */
  public static final String SEED = "seed";

  private static final Map<String, ListSource> BY_ID = Map.of(
    "ofac", ListSource.OFAC_SDN,
    "un", ListSource.UN_CONSOLIDATED,
    "eu", ListSource.EU_CFSP,
    "uk", ListSource.UK_HMT,
    "au", ListSource.AU_DFAT
  );

  private SanctionsSources() {
  }

  /** The {@link ListSource} for a provider id, if it is an authoritative jurisdiction list. */
  public static Optional<ListSource> listSource(String providerId) {
    return providerId == null ? Optional.empty() : Optional.ofNullable(BY_ID.get(providerId.toLowerCase()));
  }

  public static boolean isSeed(String providerId) {
    return SEED.equalsIgnoreCase(providerId);
  }
}
