import {
  FINANCE_ICONS, LAW_ICONS, GENERIC_ICONS, ENTERTAINMENT_ICONS, SPORTS_ICONS,
  type IconDef,
} from './icons';
import { pick, pickMany } from './hash';

/**
 * Keyword → icon-id mapping. Matched case-insensitively as whole words against
 * `title + category + tags + excerpt`. Order matters only in that earlier
 * matches are kept first when multiple phrases hit — resolveIcons() dedupes
 * and caps at 3. Entertainment/sports patterns sit first: LEN's headlines are
 * almost always framed as legal analysis ("...Arbitration Award...",
 * "...Defamation Defense"), so without priority every celebrity/athlete
 * story converges on the same scales/gavel/courthouse icons regardless of
 * who or what it's actually about.
 */
const KEYWORD_ICONS: Array<{ pattern: RegExp; icons: string[] }> = [
  { pattern: /\bfilm|movie|actor|actress|hollywood|studio|screen|premiere|box office/i, icons: ['camera', 'filmClap', 'star'] },
  { pattern: /\balbum|tour|grammy|singer|musician|concert|record label/i, icons: ['microphone', 'star', 'camera'] },
  { pattern: /\btelevision|tv show|streaming|series|episode/i, icons: ['filmClap', 'camera', 'star'] },
  { pattern: /\bathlete|footballer|soccer|nfl|nba|mls|nhl|olympic|tournament|championship|quarterback|striker|match\b/i, icons: ['trophy', 'sportsBall', 'medal'] },
  { pattern: /\bceleb(?:rity|rities)|paparazzi|red carpet|tabloid/i, icons: ['camera', 'star', 'microphone'] },
  { pattern: /\bmortgage|home loan|refinanc/i, icons: ['house', 'percent', 'chartUp'] },
  { pattern: /\binflation|purchasing power|cost of living/i, icons: ['coinStack', 'chartDown', 'wallet'] },
  { pattern: /\bbudget|budgeting|50\/30\/20/i, icons: ['calculator', 'pieChart', 'wallet'] },
  { pattern: /\bsaving|emergency fund/i, icons: ['piggyBank', 'coinStack', 'growthArrow'] },
  { pattern: /\bdebt|loan|credit card/i, icons: ['creditCard', 'chartDown', 'invoice'] },
  { pattern: /\binvest|stock|equit|etf|mutual fund/i, icons: ['pieChart', 'chartUp', 'growthArrow'] },
  { pattern: /\bretirement|401k|pension/i, icons: ['piggyBank', 'growthArrow', 'chartUp'] },
  { pattern: /\bbank|banking|checking account/i, icons: ['bank', 'wallet', 'creditCard'] },
  { pattern: /\bnet worth|wealth|millionaire/i, icons: ['growthArrow', 'coinStack', 'chartUp'] },
  { pattern: /\bincome|salary|side hustle|passive income/i, icons: ['wallet', 'growthArrow', 'coinStack'] },
  { pattern: /\btax|invoice|billing/i, icons: ['invoice', 'calculator', 'creditCard'] },
  { pattern: /\barbitration|dispute|mediation/i, icons: ['scales', 'documentContract', 'handshake'] },
  { pattern: /\bcontract|agreement|clause/i, icons: ['documentContract', 'scales', 'briefcase'] },
  { pattern: /\bcourt|litigation|lawsuit|trial/i, icons: ['courthouse', 'gavel', 'scales'] },
  { pattern: /\bcompliance|regulation|regulatory/i, icons: ['shieldCheck', 'stamp', 'documentContract'] },
  { pattern: /\battorney|lawyer|counsel/i, icons: ['briefcase', 'scales', 'gavel'] },
  { pattern: /\bstatute|law\b|legal code/i, icons: ['bookStatute', 'scales', 'gavel'] },
  { pattern: /\bnotary|stamp|certif/i, icons: ['stamp', 'shieldCheck', 'documentContract'] },
  { pattern: /\bserver|cloud|infrastructure/i, icons: ['server', 'cloud', 'database'] },
  { pattern: /\bapi|integration|database/i, icons: ['apiNode', 'database', 'server'] },
  { pattern: /\bteam|workforce|hiring/i, icons: ['team', 'workflowArrow', 'report'] },
];

export interface ArticleInput {
  title: string;
  category?: string | null;
  tags?: string[] | null;
  excerpt?: string | null;
  seed: string;
}

/** Entertainment/sports categories checked first: LEN's law-flavored category
 * names ("Celebrity News") would otherwise fall through to the law-keyword
 * check below on words like "litigation" that also appear in "Celebrity
 * News" article titles — category identity should win over that coincidence. */
function iconPoolForCategory(category?: string | null): IconDef[] {
  const normalized = (category || '').toLowerCase();
  if (['celebrity', 'movie', 'film', 'music', 'television', 'streaming', 'entertainment'].some((m) => normalized.includes(m))) {
    return ENTERTAINMENT_ICONS;
  }
  if (['sport', 'athlete', 'athletic'].some((m) => normalized.includes(m))) {
    return SPORTS_ICONS;
  }
  if (['law', 'legal', 'court', 'attorney', 'lawyer', 'compliance', 'litigation'].some((m) => normalized.includes(m))) {
    return LAW_ICONS;
  }
  if (['finance', 'invest', 'market', 'econom', 'budget', 'saving', 'money'].some((m) => normalized.includes(m))) {
    return FINANCE_ICONS;
  }
  return GENERIC_ICONS;
}

/** Resolve 2-3 icons for an article: one guaranteed from the category's own
 * pool (so a "Celebrity News" story never shows only generic law icons just
 * because its headline happens to say "litigation"), topped up with keyword
 * matches from title/category/tags/excerpt, and a deterministic category
 * fallback if neither produced enough. */
export function resolveIcons(input: ArticleInput): IconDef[] {
  const haystack = [input.title, input.category || '', ...(input.tags || []), input.excerpt || ''].join(' ');
  const pool = iconPoolForCategory(input.category);

  const matchedIds: string[] = [];
  const categoryIsTopical = pool === ENTERTAINMENT_ICONS || pool === SPORTS_ICONS;
  if (categoryIsTopical) {
    matchedIds.push(pick(pool, input.seed, 'icon-category-lead').id);
  }
  for (const { pattern, icons } of KEYWORD_ICONS) {
    if (pattern.test(haystack)) {
      for (const id of icons) {
        if (!matchedIds.includes(id)) matchedIds.push(id);
      }
    }
    if (matchedIds.length >= 3) break;
  }

  const matched = matchedIds.slice(0, 3).map((id) => getIconById(id)).filter(Boolean) as IconDef[];
  if (matched.length >= 2) return matched;

  const fallback = pickMany(pool, input.seed, 2, 'icon-fallback');
  // Merge any partial keyword match with the deterministic fallback, deduped.
  const merged = [...matched, ...fallback].filter(
    (icon, index, arr) => arr.findIndex((other) => other.id === icon.id) === index,
  );
  return merged.slice(0, 3);
}

const ICON_BY_ID = new Map(
  [...FINANCE_ICONS, ...LAW_ICONS, ...GENERIC_ICONS, ...ENTERTAINMENT_ICONS, ...SPORTS_ICONS].map(
    (icon) => [icon.id, icon],
  ),
);
function getIconById(id: string): IconDef | undefined {
  return ICON_BY_ID.get(id);
}
