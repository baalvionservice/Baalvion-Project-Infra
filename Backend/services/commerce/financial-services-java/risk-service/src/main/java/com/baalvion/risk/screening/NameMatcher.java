package com.baalvion.risk.screening;

import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Fuzzy name similarity for sanctions screening, in [0.0, 1.0].
 *
 * <p>Combines Jaro–Winkler (robust to typos, transpositions, and shared prefixes — the de-facto
 * standard for watchlist name matching) with a token-reordering pass so that "Vladimir Putin" matches
 * "PUTIN, VLADIMIR" and a token-coverage pass so that a shorter query ("Qadhafi") still scores highly
 * against a longer listed name ("Muammar Qadhafi"). The score is the max of these strategies.
 *
 * <p>Inputs are expected to be {@link NameNormalizer}-normalized. Deterministic and dependency-free.
 */
@Component
public class NameMatcher {

  /** Similarity in [0,1] between two already-normalized names. */
  public double score(String a, String b) {
    if (a == null || b == null || a.isEmpty() || b.isEmpty()) {
      return 0.0;
    }
    if (a.equals(b)) {
      return 1.0;
    }
    double whole = jaroWinkler(a, b);

    // Token-reorder: compare with tokens sorted, so word order does not penalize.
    String sa = sortTokens(a);
    String sb = sortTokens(b);
    double reordered = sa.equals(a) && sb.equals(b) ? whole : jaroWinkler(sa, sb);

    // Token-coverage: each query token's best Jaro–Winkler against any candidate token, averaged.
    double coverage = tokenCoverage(a, b);

    return Math.max(whole, Math.max(reordered, coverage));
  }

  private static String sortTokens(String s) {
    String[] t = s.split(" ");
    Arrays.sort(t);
    return String.join(" ", t);
  }

  /**
   * Token-set similarity: sum of each shorter-set token's best Jaro–Winkler against the longer set,
   * normalized by the <em>longer</em> token count. Normalizing by the longer set keeps both recall and
   * precision in view, so a single generic token (e.g. "Bank") cannot score 1.0 against a multi-word
   * listed name ("Bank Melli Iran") and spuriously auto-block; a genuine full-name match still scores
   * high. Exact matches are short-circuited to 1.0 in {@link #score} regardless.
   */
  private double tokenCoverage(String a, String b) {
    String[] ta = a.split(" ");
    String[] tb = b.split(" ");
    String[] shorter = ta.length <= tb.length ? ta : tb;
    String[] longer = ta.length <= tb.length ? tb : ta;
    if (longer.length == 0) {
      return 0.0;
    }
    double sumBest = 0.0;
    for (String s : shorter) {
      double best = 0.0;
      for (String l : longer) {
        best = Math.max(best, jaroWinkler(s, l));
      }
      sumBest += best;
    }
    return sumBest / longer.length;
  }

  /** Jaro–Winkler similarity in [0,1]. */
  double jaroWinkler(String s1, String s2) {
    double jaro = jaro(s1, s2);
    int prefix = 0;
    int max = Math.min(4, Math.min(s1.length(), s2.length()));
    for (int i = 0; i < max; i++) {
      if (s1.charAt(i) == s2.charAt(i)) {
        prefix++;
      } else {
        break;
      }
    }
    return jaro + prefix * 0.1 * (1.0 - jaro);
  }

  /** Jaro similarity in [0,1]. */
  double jaro(String s1, String s2) {
    if (s1.equals(s2)) {
      return 1.0;
    }
    int len1 = s1.length();
    int len2 = s2.length();
    if (len1 == 0 || len2 == 0) {
      return 0.0;
    }
    int matchDistance = Math.max(len1, len2) / 2 - 1;
    if (matchDistance < 0) {
      matchDistance = 0;
    }

    boolean[] s1Matches = new boolean[len1];
    boolean[] s2Matches = new boolean[len2];

    int matches = 0;
    for (int i = 0; i < len1; i++) {
      int start = Math.max(0, i - matchDistance);
      int end = Math.min(i + matchDistance + 1, len2);
      for (int j = start; j < end; j++) {
        if (s2Matches[j] || s1.charAt(i) != s2.charAt(j)) {
          continue;
        }
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
    if (matches == 0) {
      return 0.0;
    }

    // Count transpositions.
    double transpositions = 0;
    int k = 0;
    for (int i = 0; i < len1; i++) {
      if (!s1Matches[i]) {
        continue;
      }
      while (!s2Matches[k]) {
        k++;
      }
      if (s1.charAt(i) != s2.charAt(k)) {
        transpositions++;
      }
      k++;
    }
    transpositions /= 2.0;

    double m = matches;
    return ((m / len1) + (m / len2) + ((m - transpositions) / m)) / 3.0;
  }
}
