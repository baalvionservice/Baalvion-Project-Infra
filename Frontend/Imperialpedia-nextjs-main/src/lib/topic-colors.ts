import { parentFor } from "./topic-config";

/**
 * One accent color per top-level nav section (mirrors CATEGORY_GROUPS in
 * topic-config.ts), used to color category eyebrows/badges instead of every
 * topic sharing the same blue. Keys are lowercase group labels.
 */
const SECTION_COLORS: Record<string, string> = {
  investing: "#1d4fc4",
  markets: "#0f9d58",
  banking: "#7c3aed",
  "personal finance": "#db2777",
  economy: "#ea580c",
  reviews: "#d97706",
  budgeting: "#0891b2",
};

const DEFAULT_COLOR = "#1d4fc4";

// Category names that show up as free text (CMS category, NewsCategory enum,
// topic-config titles) rather than a nav slug — matched by keyword so a label
// like "Cryptocurrency & Digital Assets" or "RealEstate" still resolves.
const KEYWORD_SECTION: [RegExp, string][] = [
  [/stock|bond|etf|mutual.?fund|option|commodit|crypto|real.?estate|retirement|portfolio|broker|invest/i, "investing"],
  [/market|earning|calendar|world/i, "markets"],
  [/bank|saving|checking|cd.?rate|money.?market|credit.?card|loan|mortgage/i, "banking"],
  [/personal.?finance|budget|debt|planning|financial.?independence|money.?management|credit(?!.?card)/i, "personal finance"],
  [/econom|indicator|fed|inflation|gdp|unemployment|interest.?rate|fiscal|monetary|politic/i, "economy"],
  [/review/i, "reviews"],
];

/**
 * Resolves a category display name or slug to its section's accent color.
 * Falls back to the site's default primary blue for anything unrecognized.
 */
export function getTopicColor(categoryOrSlug?: string | null): string {
  if (!categoryOrSlug) return DEFAULT_COLOR;
  const slug = categoryOrSlug.trim().toLowerCase().replace(/\s+/g, "-");

  const parent = parentFor(slug);
  if (parent) {
    const key = parent.label.toLowerCase();
    if (SECTION_COLORS[key]) return SECTION_COLORS[key];
  }
  if (SECTION_COLORS[slug.replace(/-/g, " ")]) return SECTION_COLORS[slug.replace(/-/g, " ")];

  for (const [pattern, section] of KEYWORD_SECTION) {
    if (pattern.test(categoryOrSlug)) return SECTION_COLORS[section];
  }
  return DEFAULT_COLOR;
}
