export interface Palette {
  id: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
  ink: string;
}

// Soft, light, brand-neutral gradients — swap these for brand-specific values.
// Two options per vertical so articles in the same category still vary visually.
export const FINANCE_PALETTES: Palette[] = [
  { id: 'financeBlue', bgFrom: '#eef4ff', bgTo: '#dbe7fd', accent: '#2454d6', ink: '#12224d' },
  { id: 'financeGreen', bgFrom: '#eefbf3', bgTo: '#d9f3e3', accent: '#1f9d55', ink: '#0f3d24' },
];

export const LAW_PALETTES: Palette[] = [
  { id: 'lawNavy', bgFrom: '#eef1f6', bgTo: '#dde3ee', accent: '#1c2f56', ink: '#101a30' },
  { id: 'lawGold', bgFrom: '#fbf6ec', bgTo: '#f3e7cd', accent: '#9a6a1f', ink: '#3a2a0f' },
];

export const NEUTRAL_PALETTES: Palette[] = [
  { id: 'neutralSlate', bgFrom: '#f4f5f7', bgTo: '#e6e8ec', accent: '#3d4759', ink: '#1b202b' },
];

// LEN pivot: "Celebrity News"/movies/music/television/sports categories were
// falling through to NEUTRAL_PALETTES (the same flat gray used for anything
// unmatched) since none of them are law or finance markers -- the site's
// most common category rendered as the least distinctive art on the page.
export const ENTERTAINMENT_PALETTES: Palette[] = [
  { id: 'entertainmentRed', bgFrom: '#fff1f2', bgTo: '#fde0e2', accent: '#c81e3a', ink: '#3a0f16' },
  { id: 'entertainmentPurple', bgFrom: '#f6f0fb', bgTo: '#e9dbf5', accent: '#7c3aed', ink: '#2c1650' },
];

export const SPORTS_PALETTES: Palette[] = [
  { id: 'sportsGreen', bgFrom: '#eefbf0', bgTo: '#d7f3dc', accent: '#1c8a3d', ink: '#0f3d1d' },
  { id: 'sportsAmber', bgFrom: '#fff7ec', bgTo: '#fde9c7', accent: '#c2740a', ink: '#3a2408' },
];

const LAW_MARKERS = ['law', 'legal', 'court', 'attorney', 'lawyer', 'compliance', 'litigation'];
const ENTERTAINMENT_MARKERS = ['celebrity', 'movie', 'film', 'music', 'television', 'streaming', 'entertainment'];
const SPORTS_MARKERS = ['sport', 'athlete', 'athletic'];

/** Entertainment/sports checked before law: a "Celebrity News" category name
 * should win over any law-marker word that happens to also appear in it. */
export function paletteGroupForCategory(category?: string | null): Palette[] {
  const normalized = (category || '').toLowerCase();
  if (ENTERTAINMENT_MARKERS.some((marker) => normalized.includes(marker))) return ENTERTAINMENT_PALETTES;
  if (SPORTS_MARKERS.some((marker) => normalized.includes(marker))) return SPORTS_PALETTES;
  if (LAW_MARKERS.some((marker) => normalized.includes(marker))) return LAW_PALETTES;
  if (normalized.includes('finance') || normalized.includes('invest') || normalized.includes('market') || normalized.includes('econom')) {
    return FINANCE_PALETTES;
  }
  return NEUTRAL_PALETTES;
}
