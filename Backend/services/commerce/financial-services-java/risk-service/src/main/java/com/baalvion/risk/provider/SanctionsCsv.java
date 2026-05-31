package com.baalvion.risk.provider;

import java.util.ArrayList;
import java.util.List;

/**
 * Minimal RFC-4180 CSV reader for the OFAC feeds (sdn.csv / alt.csv / add.csv). Handles quoted
 * fields (with {@code ""} escaping and embedded commas/newlines) and maps OFAC's {@code -0-} empty
 * sentinel to {@code null}. Dependency-free; deterministic; unit-tested.
 */
public final class SanctionsCsv {

  private SanctionsCsv() {}

  /** Parse full CSV content into rows of fields. {@code -0-} fields become null. */
  public static List<List<String>> parse(String content) {
    List<List<String>> rows = new ArrayList<>();
    if (content == null || content.isEmpty()) {
      return rows;
    }
    List<String> row = new ArrayList<>();
    StringBuilder field = new StringBuilder();
    boolean inQuotes = false;
    int n = content.length();
    for (int i = 0; i < n; i++) {
      char c = content.charAt(i);
      if (inQuotes) {
        if (c == '"') {
          if (i + 1 < n && content.charAt(i + 1) == '"') {
            field.append('"');
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field.append(c);
        }
      } else {
        switch (c) {
          case '"' -> inQuotes = true;
          case ',' -> { row.add(clean(field)); field.setLength(0); }
          case '\r' -> { /* swallow; handled by \n */ }
          case '\n' -> {
            row.add(clean(field)); field.setLength(0);
            rows.add(row); row = new ArrayList<>();
          }
          default -> field.append(c);
        }
      }
    }
    // trailing field / row (no final newline)
    if (field.length() > 0 || !row.isEmpty()) {
      row.add(clean(field));
      rows.add(row);
    }
    return rows;
  }

  /** OFAC uses the literal {@code -0-} for "no value"; treat it (and blanks) as null. */
  private static String clean(StringBuilder sb) {
    String s = sb.toString().trim();
    return (s.isEmpty() || "-0-".equals(s)) ? null : s;
  }
}
