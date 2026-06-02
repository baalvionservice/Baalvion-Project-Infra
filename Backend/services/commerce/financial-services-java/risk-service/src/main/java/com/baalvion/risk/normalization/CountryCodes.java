package com.baalvion.risk.normalization;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Country-name → ISO-3166-1 alpha-2 standardization for the canonical normalization layer.
 *
 * <p>Built from the JDK's own ISO country table ({@link Locale#getISOCountries()}) plus a small alias
 * map for the variant spellings the sanctions feeds use ("USA", "Russian Federation", "Korea, North", …).
 * Dependency-free. {@link #toIso(String)} returns the alpha-2 code when recognized, otherwise the
 * trimmed input unchanged, so an unknown country is preserved (never dropped) — important for
 * cross-source dedup where collapsing to a wrong code would be worse than keeping the raw value.
 */
public final class CountryCodes {

  private CountryCodes() {}

  private static final Map<String, String> NAME_TO_ISO = new HashMap<>();

  static {
    // JDK ISO table: display name (English) -> alpha-2, and the code itself -> code.
    for (String code : Locale.getISOCountries()) {
      String name = new Locale("", code).getDisplayCountry(Locale.ENGLISH);
      if (name != null && !name.isBlank()) {
        NAME_TO_ISO.put(norm(name), code);
      }
      NAME_TO_ISO.put(norm(code), code);
    }
    // Common sanctions-feed variants not in the JDK display table.
    putAll("US", "USA", "U.S.A.", "UNITED STATES", "UNITED STATES OF AMERICA");
    putAll("GB", "UK", "U.K.", "UNITED KINGDOM", "GREAT BRITAIN", "BRITAIN", "ENGLAND");
    putAll("RU", "RUSSIA", "RUSSIAN FEDERATION");
    putAll("IR", "IRAN", "ISLAMIC REPUBLIC OF IRAN");
    putAll("KP", "NORTH KOREA", "KOREA, NORTH", "DPRK", "DEMOCRATIC PEOPLE'S REPUBLIC OF KOREA");
    putAll("KR", "SOUTH KOREA", "KOREA, SOUTH", "REPUBLIC OF KOREA");
    putAll("SY", "SYRIA", "SYRIAN ARAB REPUBLIC");
    putAll("VE", "VENEZUELA", "BOLIVARIAN REPUBLIC OF VENEZUELA");
    putAll("CD", "DRC", "DR CONGO", "DEMOCRATIC REPUBLIC OF THE CONGO", "CONGO, DEMOCRATIC REPUBLIC");
    putAll("CG", "CONGO", "REPUBLIC OF THE CONGO");
    putAll("TZ", "TANZANIA", "UNITED REPUBLIC OF TANZANIA");
    putAll("BO", "BOLIVIA");
    putAll("LA", "LAOS", "LAO PEOPLE'S DEMOCRATIC REPUBLIC");
    putAll("MD", "MOLDOVA");
    putAll("CI", "IVORY COAST", "COTE D'IVOIRE");
    putAll("VN", "VIETNAM", "VIET NAM");
    putAll("CZ", "CZECH REPUBLIC", "CZECHIA");
  }

  private static void putAll(String iso, String... names) {
    for (String n : names) {
      NAME_TO_ISO.put(norm(n), iso);
    }
  }

  private static String norm(String s) {
    return s == null ? "" : s.trim().toUpperCase(Locale.ENGLISH);
  }

  /** ISO-3166 alpha-2 code if recognized; otherwise the trimmed original (never null for non-null input). */
  public static String toIso(String country) {
    if (country == null || country.isBlank()) {
      return country;
    }
    String iso = NAME_TO_ISO.get(norm(country));
    return iso != null ? iso : country.trim();
  }
}
