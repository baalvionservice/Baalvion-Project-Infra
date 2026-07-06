import { FINANCE_ICONS, LAW_ICONS, GENERIC_ICONS, type IconDef } from './icons';
import { pickMany } from './hash';

/**
 * Keyword → icon-id mapping. Matched case-insensitively as whole words against
 * `title + tags + excerpt`. Order matters only in that earlier matches are kept
 * first when multiple phrases hit — resolveIcons() dedupes and caps at 3.
 */
const KEYWORD_ICONS: Array<{ pattern: RegExp; icons: string[] }> = [
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

function iconPoolForCategory(category?: string | null): IconDef[] {
  const normalized = (category || '').toLowerCase();
  if (['law', 'legal', 'court', 'attorney', 'lawyer', 'compliance', 'litigation'].some((m) => normalized.includes(m))) {
    return LAW_ICONS;
  }
  if (['finance', 'invest', 'market', 'econom', 'budget', 'saving', 'money'].some((m) => normalized.includes(m))) {
    return FINANCE_ICONS;
  }
  return GENERIC_ICONS;
}

/** Resolve 2-3 icons for an article: keyword matches first, hash-picked category defaults as fallback. */
export function resolveIcons(input: ArticleInput): IconDef[] {
  const haystack = [input.title, ...(input.tags || []), input.excerpt || ''].join(' ');
  const matchedIds: string[] = [];
  for (const { pattern, icons } of KEYWORD_ICONS) {
    if (pattern.test(haystack)) {
      for (const id of icons) {
        if (!matchedIds.includes(id)) matchedIds.push(id);
      }
    }
    if (matchedIds.length >= 3) break;
  }

  const allById = new Map(
    [...FINANCE_ICONS, ...LAW_ICONS, ...GENERIC_ICONS].map((icon) => [icon.id, icon]),
  );
  const matched = matchedIds.slice(0, 3).map((id) => allById.get(id)).filter(Boolean) as IconDef[];
  if (matched.length >= 2) return matched;

  const pool = iconPoolForCategory(input.category);
  const fallback = pickMany(pool, input.seed, 2, 'icon-fallback');
  // Merge any partial keyword match with the deterministic fallback, deduped.
  const merged = [...matched, ...fallback].filter(
    (icon, index, arr) => arr.findIndex((other) => other.id === icon.id) === index,
  );
  return merged.slice(0, 3);
}
