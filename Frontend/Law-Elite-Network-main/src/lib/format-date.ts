/**
 * CMS/API articles carry a raw ISO timestamp ("2026-07-02T20:59:34.882Z");
 * bundled/seed data is already a human date ("June 18, 2026"). Reformat only
 * what actually looks like a date string so hand-authored values pass
 * through unchanged.
 */
export function formatArticleDate(value?: string | null): string | undefined {
  if (!value) return value ?? undefined;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
