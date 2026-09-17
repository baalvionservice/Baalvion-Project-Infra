/**
 * Normalizes a date value for machine-readable metadata (JSON-LD
 * datePublished/dateModified, OG article:published_time/modified_time) to
 * ISO 8601. CMS/API articles already carry ISO timestamps
 * ("2026-07-03T12:11:55.817Z"); bundled/seed data carries a human-readable
 * date ("June 18, 2026") -- both parse through the same `Date` constructor,
 * so this only needs to reformat, not branch on source.
 *
 * Never fabricates a date: an empty/missing/unparseable value returns
 * `undefined` so the caller omits the structured-data property entirely
 * rather than emitting a wrong or invented one (e.g. today's date).
 */
export function toIsoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  // Already ISO 8601 (date-only or full timestamp) -- `Date` parses these
  // as UTC per spec, consistently across engines, so pass through as-is.
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  // Human-readable fallback (bundled/seed data, e.g. "June 18, 2026"). This
  // form is parsed by `Date` as LOCAL time, which would make the resulting
  // UTC instant depend on the server's timezone (e.g. midnight IST rolls
  // back to the previous day in UTC). Read the local year/month/day back off
  // the parsed value -- accurate regardless of timezone, since it's the same
  // local representation used to construct it -- and re-anchor at UTC
  // midnight so the conversion is deterministic no matter where this runs.
  const localParsed = new Date(trimmed);
  if (Number.isNaN(localParsed.getTime())) return undefined;
  return new Date(
    Date.UTC(localParsed.getFullYear(), localParsed.getMonth(), localParsed.getDate()),
  ).toISOString();
}

/**
 * Article records reach these helpers in more than one shape. The metadata
 * path (article-metadata-fetch.ts) maps CMS fields to snake_case; the render
 * path (article-fetch.ts) returns the raw CMS record, which is camelCase, and
 * the bundled/seed sources use snake_case again.
 *
 * Reading only `published_at` silently dropped datePublished/dateModified from
 * the Article JSON-LD on every CMS-served page while the OpenGraph tags — fed
 * by the mapping path — carried the same date correctly. Undated legal
 * guidance is a real trust problem on YMYL content, so read every shape.
 */
export function articleDates(article: any): { published?: string; modified?: string } {
  const published = toIsoDate(article?.published_at ?? article?.publishedAt);
  const modified = toIsoDate(article?.updated_at ?? article?.updatedAt);
  // A record with only an update timestamp is still dated; CMS drafts that
  // have never been published carry updatedAt alone.
  return { published: published ?? modified, modified: modified ?? published };
}
