/**
 * File-based loader for the `/research` hub.
 *
 * Research papers are authored as Markdown in `content-gen/research/*.md` and
 * parsed at build time via the shared `loadSection` parser into the `RichDoc`
 * shape the `AuthorityDoc` renderer understands. Server-only (filesystem read).
 */
import type { RichDoc } from '@/lib/cms';
import { loadSection } from '@/lib/section-content';

// Category-defining pieces first. Exported as a plain constant (no filesystem
// access) so the sitemap and other server modules can enumerate research URLs
// without triggering a runtime fs read.
export const RESEARCH_SLUGS = ['what-is-a-trade-operating-system'];

export function loadResearch(): RichDoc[] {
  return loadSection('research', 'research', RESEARCH_SLUGS);
}

export function getResearch(slug: string): RichDoc | null {
  return loadResearch().find((d) => d.slug === slug) || null;
}

export function getResearchSlugs(): string[] {
  return loadResearch().map((d) => d.slug);
}
