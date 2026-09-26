/**
 * @fileOverview Category taxonomy for the AI-prompt directory (/prompts).
 *
 * Categories themselves are free-text on each Prompt row in imperialpedia-service (no
 * dedicated backend entity — 11 categories doesn't warrant one yet). This config is purely a
 * presentation-layer taxonomy: it groups those real category slugs into logical sections
 * (Seasons / Festivals / People & Style) with clean display labels and a deliberate order,
 * instead of the flat alphabetical list `fetchPromptCategories()` returns on its own.
 *
 * A category slug that exists in the database but isn't listed here still shows up — grouped
 * under "More" and title-cased from its slug — so a newly-added category from the admin panel
 * is never silently dropped from the site just because this file hasn't been updated yet.
 */

export interface CategoryGroupDef {
  id: string;
  label: string;
}

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  { id: 'seasons', label: 'Seasons' },
  { id: 'festivals', label: 'Festivals & Occasions' },
  { id: 'people', label: 'People & Style' },
  { id: 'more', label: 'More' },
];

interface CategoryMeta {
  label: string;
  group: string;
  order: number;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  autumn:       { label: 'Autumn',       group: 'seasons',   order: 1 },
  winter:       { label: 'Winter',       group: 'seasons',   order: 2 },
  christmas:    { label: 'Christmas',    group: 'festivals', order: 1 },
  halloween:    { label: 'Halloween',    group: 'festivals', order: 2 },
  'new-year':   { label: 'New Year',     group: 'festivals', order: 3 },
  diwali:       { label: 'Diwali',       group: 'festivals', order: 4 },
  men:          { label: 'Men',          group: 'people',    order: 1 },
  women:        { label: 'Women',        group: 'people',    order: 2 },
  couples:      { label: 'Couples',      group: 'people',    order: 3 },
  birthday:     { label: 'Birthday',     group: 'people',    order: 4 },
  'cars-bikes': { label: 'Cars & Bikes', group: 'people',    order: 5 },
};

/** Clean display label for a category slug — falls back to a title-cased version of the slug
 * for anything not yet registered above. */
export function categoryLabel(slug: string): string {
  return CATEGORY_META[slug]?.label ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Honest, written-in-house descriptions of what's actually in each category today — never
 * copy pulled from another site, and never describing content that doesn't exist yet. Single
 * source for both the on-page "Explore Prompt Categories" copy (PromptHomeContent) and each
 * category page's meta description — so a search result reads real, specific sentences per
 * category instead of one template sentence with the category name swapped in. */
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  men: 'Cinematic, editorial-style portrait prompts — old-money aesthetics, night street portraits, monochrome studio looks, and golden-hour rooftop shots.',
  women: 'Soft, flattering portrait prompts built around natural light and color — window-light close-ups, golden-hour backlighting, and pastel editorial looks.',
  couples: 'Two-subject prompts — golden-hour beach walks, city-light portraits, and rainy-day cinematic scenes, written to preserve both faces exactly.',
  birthday: 'Celebration prompts — balloon bokeh, candlelit cake close-ups, a confetti action shot, and a warm string-light party backdrop.',
  'cars-bikes': 'Studio-style and cinematic prompts for vehicle photos — showroom lighting, golden-hour open roads, and wet-night city reflections.',
  autumn: 'Warm, golden-hour prompts built around fall color — amber forest light, cozy knitwear close-ups, and rainy café-window moods.',
  winter: 'Cool-toned portrait prompts for snow and cold light — falling-snow close-ups, cabin fireplace warmth, and snowy mountain wide shots.',
  christmas: 'Holiday-card prompts — string-light bokeh, a tree-side portrait, a stylized snow-globe effect, and a cozy pajamas-and-cocoa scene.',
  halloween: 'Prompts from dramatic to family-friendly — moody vampire lighting, a foggy graveyard scene, and a warm pumpkin-patch alternative.',
  'new-year': 'Countdown-ready prompts — gold confetti bokeh, a city-skyline fireworks shot, and a fashion-editorial sparkle treatment.',
  diwali: 'Prompts built around diya light and festival color — a close diya-lit portrait, a marigold-and-rangoli courtyard scene, and a bokeh diya trail.',
};

export interface CategoryColor { bg: string; text: string; solid: string }

/** Per-category accent — same tinted-pill convention as TopicCard.tsx elsewhere on the site
 * (bg-*-50/dark:bg-*-900 tint, *-600/dark:*-400 text) so category badges fit the rest of
 * Imperialpedia rather than inventing a one-off palette. Named categories get a fixed color so
 * the same category always reads the same way across pages; anything new falls back to
 * DEFAULT_CATEGORY_COLOR. Shared by PromptCategoryTabs (pill nav) and the prompt grid card
 * (category badge), so the two stay in sync automatically. */
export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  men:          { bg: 'bg-blue-50 dark:bg-blue-900/30',       text: 'text-blue-600 dark:text-blue-400',       solid: 'bg-blue-600' },
  women:        { bg: 'bg-rose-50 dark:bg-rose-900/30',       text: 'text-rose-600 dark:text-rose-400',       solid: 'bg-rose-600' },
  couples:      { bg: 'bg-red-50 dark:bg-red-900/30',         text: 'text-red-600 dark:text-red-400',         solid: 'bg-red-600' },
  birthday:     { bg: 'bg-purple-50 dark:bg-purple-900/30',   text: 'text-purple-600 dark:text-purple-400',   solid: 'bg-purple-600' },
  'cars-bikes': { bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-600 dark:text-slate-300',     solid: 'bg-slate-600' },
  autumn:       { bg: 'bg-amber-50 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400',     solid: 'bg-amber-600' },
  winter:       { bg: 'bg-sky-50 dark:bg-sky-900/30',         text: 'text-sky-600 dark:text-sky-400',         solid: 'bg-sky-600' },
  christmas:    { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', solid: 'bg-emerald-600' },
  halloween:    { bg: 'bg-orange-50 dark:bg-orange-900/30',   text: 'text-orange-600 dark:text-orange-400',   solid: 'bg-orange-600' },
  'new-year':   { bg: 'bg-yellow-50 dark:bg-yellow-900/30',   text: 'text-yellow-600 dark:text-yellow-500',   solid: 'bg-yellow-500' },
  diwali:       { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/30', text: 'text-fuchsia-600 dark:text-fuchsia-400', solid: 'bg-fuchsia-600' },
};
export const DEFAULT_CATEGORY_COLOR: CategoryColor = { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', solid: 'bg-gray-600' };

export function categoryColor(slug: string | null | undefined): CategoryColor {
  return (slug && CATEGORY_COLORS[slug]) || DEFAULT_CATEGORY_COLOR;
}

/** Groups + orders a flat list of category slugs (as returned by fetchPromptCategories) into
 * CATEGORY_GROUPS order, each group's categories in their configured order. Slugs with no
 * registered metadata land in the "more" group, alphabetically. Empty groups are omitted. */
export function groupCategories(slugs: string[]): { group: CategoryGroupDef; slugs: string[] }[] {
  const byGroup = new Map<string, string[]>();
  for (const slug of slugs) {
    const groupId = CATEGORY_META[slug]?.group ?? 'more';
    if (!byGroup.has(groupId)) byGroup.set(groupId, []);
    byGroup.get(groupId)!.push(slug);
  }
  for (const [groupId, groupSlugs] of byGroup) {
    groupSlugs.sort((a, b) => {
      if (groupId === 'more') return a.localeCompare(b);
      return (CATEGORY_META[a]?.order ?? 0) - (CATEGORY_META[b]?.order ?? 0);
    });
  }
  return CATEGORY_GROUPS
    .map((group) => ({ group, slugs: byGroup.get(group.id) ?? [] }))
    .filter((g) => g.slugs.length > 0);
}
