/**
 * Canonical article URL scheme, matching how wire outlets like CNBC path their
 * own article pages (`/YYYY/MM/DD/slug`) instead of a bare `/slug`.
 */
export function articleUrl(dateISO: string | null | undefined, slug: string): string {
  const parsed = dateISO ? new Date(dateISO) : new Date();
  const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const yyyy = safe.getUTCFullYear();
  const mm = String(safe.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(safe.getUTCDate()).padStart(2, "0");
  return `/${yyyy}/${mm}/${dd}/${slug}`;
}

export interface LinkableStory {
  slug?: string;
  dateISO?: string;
  href?: string;
}

/**
 * Resolves a World news tile to a clickable destination: an owned article page
 * when we have a slug (CMS/editorial content), an external link when it's wire
 * content with no owned article (Google News fallback), or null when there's
 * nothing to link to yet.
 */
export function storyHref(item: LinkableStory): { href: string; external: boolean } | null {
  if (item.slug) return { href: articleUrl(item.dateISO, item.slug), external: false };
  if (item.href) return { href: item.href, external: true };
  return null;
}
