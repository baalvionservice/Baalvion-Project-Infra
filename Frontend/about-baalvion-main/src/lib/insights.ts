/**
 * File-based loader for the `/insights` research hub.
 *
 * Insights are authored as Markdown in `content-gen/insights/*.md` and parsed at
 * build time via the shared `loadSection` parser into the `RichDoc` shape the
 * `AuthorityDoc` renderer understands. Server-only (filesystem read at SSG/ISR).
 */
import type { RichDoc } from '@/lib/cms';
import { loadSection } from '@/lib/section-content';

// Explicit publication order for the Batch-1 problem-awareness cluster.
// Exported as a plain constant (no filesystem access) so the sitemap and other
// server modules can enumerate insight URLs without triggering a runtime fs read.
export const INSIGHT_SLUGS = [
  'global-trade-emails-pdfs-spreadsheets',
  'hidden-cost-export-documentation',
  'export-delays-before-cargo-moves',
];

export function loadInsights(): RichDoc[] {
  return loadSection('insights', 'insight', INSIGHT_SLUGS);
}

export function getInsight(slug: string): RichDoc | null {
  return loadInsights().find((d) => d.slug === slug) || null;
}

export function getInsightSlugs(): string[] {
  return loadInsights().map((d) => d.slug);
}
