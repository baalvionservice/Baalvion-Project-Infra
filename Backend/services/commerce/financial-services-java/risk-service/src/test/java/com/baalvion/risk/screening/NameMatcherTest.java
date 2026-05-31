package com.baalvion.risk.screening;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the sanctions name-matching IP: normalization (diacritics, honorifics, legal forms)
 * and Jaro–Winkler similarity with token-reordering and token-coverage strategies.
 */
class NameMatcherTest {

  private final NameMatcher matcher = new NameMatcher();

  // ----------------------------------------------------------------- normalization

  @Test
  void normalizeFoldsCaseDiacriticsAndPunctuation() {
    assertThat(NameNormalizer.normalize("Müller")).isEqualTo("MULLER");
    assertThat(NameNormalizer.normalize("O'Brien-Smith")).isEqualTo("OBRIEN SMITH");
    assertThat(NameNormalizer.normalize("PUTIN, VLADIMIR")).isEqualTo("PUTIN VLADIMIR");
  }

  @Test
  void normalizeDropsHonorificsAndLegalForms() {
    assertThat(NameNormalizer.normalize("Mr. John Smith")).isEqualTo("JOHN SMITH");
    assertThat(NameNormalizer.normalize("Acme Trading GmbH")).isEqualTo("ACME TRADING");
    assertThat(NameNormalizer.normalize("The Wagner Co.")).isEqualTo("WAGNER");
  }

  @Test
  void normalizeTransliteratesLatinExtendedInsteadOfDropping() {
    // Non-decomposable Latin letters must be romanized, not silently deleted (which would shrink or
    // empty the matching key and make a sanctioned party un-screenable).
    assertThat(NameNormalizer.normalize("Łukashenko")).isEqualTo("LUKASHENKO");
    assertThat(NameNormalizer.normalize("Søren Jensen")).isEqualTo("SOREN JENSEN");
    assertThat(NameNormalizer.normalize("Æthelred")).isEqualTo("AETHELRED");
    assertThat(NameNormalizer.normalize("Strauß")).isEqualTo("STRAUSS");
    assertThat(NameNormalizer.normalize("Đoković")).isEqualTo("DOKOVIC");
  }

  @Test
  void normalizeKeepsAmbiguousShortTokens() {
    // "AS"/"AB" are no longer treated as noise (too easily initials / real fragments).
    assertThat(NameNormalizer.normalize("Bob As")).isEqualTo("BOB AS");
  }

  @Test
  void normalizeNeverEmptiesAnAllNoiseName() {
    // "Ltd Co" is all legal-form noise; we fall back to the cleaned form rather than lose it.
    assertThat(NameNormalizer.normalize("Ltd Co")).isEqualTo("LTD CO");
    assertThat(NameNormalizer.normalize("   ")).isEmpty();
    assertThat(NameNormalizer.normalize(null)).isEmpty();
  }

  // ----------------------------------------------------------------- similarity

  @Test
  void exactNormalizedMatchScoresOne() {
    assertThat(matcher.score("OSAMA BIN LADEN", "OSAMA BIN LADEN")).isEqualTo(1.0);
  }

  @Test
  void transliterationVariantScoresHigh() {
    // Osama/Usama, Laden/Ladin — classic watchlist transliteration noise.
    double s = matcher.score("OSAMA BIN LADEN", "USAMA BIN LADIN");
    assertThat(s).isGreaterThan(0.85);
  }

  @Test
  void wordOrderDoesNotPenalize() {
    double s = matcher.score("VLADIMIR PUTIN", "PUTIN VLADIMIR");
    assertThat(s).isGreaterThan(0.92);
  }

  @Test
  void shorterQueryStillMatchesViaTokenCoverage() {
    // A two-token query against a three-token listed name.
    double s = matcher.score("JOAQUIN GUZMAN", "JOAQUIN GUZMAN LOERA");
    assertThat(s).isGreaterThan(0.9);
  }

  @Test
  void unrelatedNamesScoreLow() {
    assertThat(matcher.score("MARIA GARCIA", "OSAMA BIN LADEN")).isLessThan(0.6);
    assertThat(matcher.score("ACME TRADING", "WAGNER")).isLessThan(0.6);
  }

  @Test
  void scoreIsSymmetricAndBounded() {
    double ab = matcher.score("VIKTOR BOUT", "VICTOR BUT");
    double ba = matcher.score("VICTOR BUT", "VIKTOR BOUT");
    assertThat(ab).isEqualTo(ba);
    assertThat(ab).isBetween(0.0, 1.0);
  }
}
