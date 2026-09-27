/**
 * "Updated {date}" title/description pattern for pages whose content set changes over time
 * (the /prompts directory today, potentially others later) — the date is computed fresh on
 * every render, not hand-typed, so it advances automatically with zero manual edits. Search
 * behavior for many topics favors a result that visibly matches "today", so this trades a
 * static title for one that self-refreshes.
 */

const ORDINAL_SUFFIX = (day: number): string => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

/** e.g. "24th September 2026" */
export function formatOrdinalDate(date: Date = new Date()): string {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${ORDINAL_SUFFIX(day)} ${month} ${year}`;
}

/** e.g. "24 Sep 2026" — compact form for tight title budgets. */
export function formatShortDate(date: Date = new Date()): string {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
