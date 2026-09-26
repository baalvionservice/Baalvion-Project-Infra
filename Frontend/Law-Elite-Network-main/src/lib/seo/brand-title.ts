const BRAND = 'Law Elite Network';

/**
 * A parent layout that sets a plain-string `title` resets the root
 * '%s | Law Elite Network' template for every page beneath it, so entity
 * pages under /people, /sports, /topics etc. shipped with no brand suffix.
 * Pages call this and set `title: { absolute: ... }` instead of relying on the
 * template.
 */
export const brandTitle = (title: string) => (title.includes(BRAND) ? title : `${title} | ${BRAND}`);

/** Meta descriptions past ~160 characters get cut mid-sentence in results; trim at a word boundary instead. */
export function clampDescription(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1).replace(/\s+\S*$/, '');
  return `${cut}…`;
}
