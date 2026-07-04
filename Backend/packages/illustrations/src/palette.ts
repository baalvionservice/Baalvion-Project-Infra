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

const LAW_MARKERS = ['law', 'legal', 'court', 'attorney', 'lawyer', 'compliance', 'litigation'];

export function paletteGroupForCategory(category?: string | null): Palette[] {
  const normalized = (category || '').toLowerCase();
  if (LAW_MARKERS.some((marker) => normalized.includes(marker))) return LAW_PALETTES;
  if (normalized.includes('finance') || normalized.includes('invest') || normalized.includes('market') || normalized.includes('econom')) {
    return FINANCE_PALETTES;
  }
  return NEUTRAL_PALETTES;
}
