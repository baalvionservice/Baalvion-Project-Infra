package com.baalvion.risk.screening;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Deterministic name normalization for sanctions matching. Folds case and diacritics, strips
 * punctuation, and drops honorifics / legal-form tokens that add no identifying signal, so that
 * "Müller GmbH", "MULLER, G.m.b.H." and "mr muller" all reduce to the same matching key. Pure,
 * side-effect-free, and fully unit-tested ({@link NameMatcher} consumes its output).
 */
public final class NameNormalizer {

  private NameNormalizer() {}

  /** Tokens that carry no identifying value and are removed before matching. */
  private static final Set<String> NOISE = Set.of(
    // honorifics
    "MR", "MRS", "MS", "MISS", "DR", "PROF", "SIR", "MADAM", "MX",
    // organisation legal forms
    "LTD", "LIMITED", "LLC", "LLP", "INC", "INCORPORATED", "CORP", "CORPORATION",
    "CO", "COMPANY", "GMBH", "AG", "SARL", "BV", "NV", "PLC", "PTE", "PVT",
    "PJSC", "OJSC", "JSC", "OAO", "OOO", "SPA", "SRL", "OY", "KG",
    // generic connectors (standard in transliterated Arabic names — OFAC's matcher ignores these too)
    "THE", "AND", "OF", "FOR", "AL", "EL"
    // NB: "AS"/"AB" (niche Scandinavian legal forms) deliberately NOT treated as noise — they are too
    // easily a person's initials or a real name fragment; stripping them widened the false-positive surface.
  );

  /**
   * Non-decomposable Latin-extended letters → ASCII, applied before the punctuation strip so these are
   * romanized rather than dropped (NFD leaves them intact, then {@code [^A-Z0-9]} would delete them and
   * silently shrink the name). Covers the letters that actually appear in Latin-script sanctions names.
   * Full transliteration of non-Latin scripts (Cyrillic/Arabic/CJK) requires an ICU4J
   * {@code Transliterator("Any-Latin; Latin-ASCII")}; the live-list providers should romanize at ingest,
   * and {@code SanctionsService.ingest} guards against an empty matching key so such an entry can never be
   * stored silently un-screenable.
   */
  private static final String[][] LATIN_EXT = {
    {"Ø", "O"}, {"ø", "o"}, {"Æ", "AE"}, {"æ", "ae"}, {"Œ", "OE"}, {"œ", "oe"},
    {"Ł", "L"}, {"ł", "l"}, {"Đ", "D"}, {"đ", "d"}, {"Ð", "D"}, {"ð", "d"},
    {"Þ", "TH"}, {"þ", "th"}, {"ß", "ss"}, {"İ", "I"}, {"ı", "i"}, {"Ħ", "H"}, {"ħ", "h"}
  };

  /**
   * Normalize a name to its matching key: ASCII-folded, uppercased, punctuation-stripped, noise-token
   * removed, single-spaced. Returns "" for null/blank/all-noise input.
   */
  public static String normalize(String raw) {
    if (raw == null || raw.isBlank()) {
      return "";
    }
    // Romanize non-decomposable Latin-extended letters BEFORE stripping diacritics, so they are not lost.
    String latin = raw;
    for (String[] pair : LATIN_EXT) {
      if (latin.indexOf(pair[0].charAt(0)) >= 0) {
        latin = latin.replace(pair[0], pair[1]);
      }
    }
    // Strip diacritics: decompose then drop combining marks.
    String ascii = Normalizer.normalize(latin, Normalizer.Form.NFD)
      .replaceAll("\\p{M}+", "");
    // Remove intra-word punctuation (straight/curly apostrophes, periods) by deleting it — so
    // "O'Brien" -> "OBRIEN" and "G.m.b.H." -> "GMBH", rather than splitting those into extra tokens.
    String joined = ascii.replaceAll("[\\u0027\\u2019.]", "");
    // Any remaining non-alphanumeric becomes a separator; uppercase; collapse whitespace.
    String cleaned = joined.toUpperCase()
      .replaceAll("[^A-Z0-9]+", " ")
      .trim();
    if (cleaned.isEmpty()) {
      return "";
    }
    String kept = Arrays.stream(cleaned.split(" "))
      .filter(t -> !t.isEmpty() && !NOISE.contains(t))
      .collect(Collectors.joining(" "));
    // If removing noise emptied the string (e.g. "The Co"), fall back to the cleaned form so we
    // never lose the subject entirely.
    return kept.isEmpty() ? cleaned : kept;
  }

  /** The distinct, order-independent token set of a normalized name. */
  public static Set<String> tokens(String normalized) {
    if (normalized == null || normalized.isBlank()) {
      return Set.of();
    }
    return new LinkedHashSet<>(Arrays.asList(normalized.split(" ")));
  }
}
