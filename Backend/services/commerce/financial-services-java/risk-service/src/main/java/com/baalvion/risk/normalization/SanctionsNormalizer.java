package com.baalvion.risk.normalization;

import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.screening.NameNormalizer;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Canonical normalization layer — the single place that turns provider-parsed raw fields into the
 * cross-source canonical form. Providers do ONLY fetch + parse; everything here (case/diacritic
 * folding via {@link NameNormalizer}, ISO-3166 country standardization, and the cross-source
 * {@code merge_key}) is source-agnostic so OFAC/EU/UN collapse into one consistent index.
 */
public final class SanctionsNormalizer {

  private SanctionsNormalizer() {}

  /** ISO-3166-standardize a country list, de-duplicated, order preserved, blanks dropped. */
  public static List<String> isoCountries(List<String> countries) {
    if (countries == null || countries.isEmpty()) {
      return List.of();
    }
    Set<String> out = new LinkedHashSet<>();
    for (String c : countries) {
      if (c != null && !c.isBlank()) {
        out.add(CountryCodes.toIso(c));
      }
    }
    return new ArrayList<>(out);
  }

  /**
   * Cross-source dedup key: {@code normalize(name) | primaryIsoCountry | type}. Two records from
   * different sources describing the same party (after ISO country folding) produce the same key and
   * are linked in {@code sanctions_source_map}. Country is the first ISO-resolved country (or empty),
   * matching the spec's {@code normalize(name + country + type)}.
   */
  public static String mergeKey(String normalizedName, List<String> isoCountries, EntityType type) {
    String country = (isoCountries == null || isoCountries.isEmpty()) ? "" : isoCountries.get(0);
    String t = (type == null) ? "" : type.name();
    return (normalizedName == null ? "" : normalizedName) + "|" + country + "|" + t;
  }
}
