package com.baalvion.risk.provider;

import java.util.List;

/**
 * Source of consolidated-watchlist records. The default {@link SeedSanctionsListProvider} ships a
 * curated, self-contained seed so screening works with no network. Real list ingestion (OFAC SDN
 * XML, the UN consolidated list, EU CFSP, UK HMT, AU DFAT) is implemented as additional providers
 * activated by {@code app.sanctions.provider}; each parses its source format into
 * {@link SanctionsListRecord}s. This mirrors the suite's "simulated | live" provider seam (no mock
 * business logic — the matching/screening engine is identical regardless of source).
 */
public interface SanctionsListProvider {

  /** Stable identifier matching {@code app.sanctions.provider} (e.g. "seed", "ofac"). */
  String name();

  /** The full set of current watchlist records from this source. */
  List<SanctionsListRecord> fetch();
}
