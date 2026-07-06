import { djb2 } from './hash';
import { NEUTRAL_PALETTES, FINANCE_PALETTES, type Palette } from './palette';

const AVATAR_PALETTES: Palette[] = [...FINANCE_PALETTES, ...NEUTRAL_PALETTES];

function pickAvatarPalette(seed: string): Palette {
  const hash = djb2(`${seed}:avatar-palette`);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length] as Palette;
}

function initialsOf(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return '?';
  if (words.length === 1) return first.slice(0, 2).toUpperCase();
  const last = words[words.length - 1] as string;
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function badgeSvg(content: string, palette: Palette): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img">` +
    `<circle cx="100" cy="100" r="100" fill="${palette.bgTo}" />` +
    `<circle cx="100" cy="100" r="96" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.5" />` +
    `${content}</svg>`
  );
}

/**
 * A generic head-and-shoulders silhouette in a brand-colored circle — used for
 * reviewer/staff avatars instead of stock headshot photography, per the style
 * guide's "no people unless abstract silhouettes" rule.
 */
export function personSilhouetteDataUri(input: { name: string; seed?: string }): string {
  const palette = pickAvatarPalette(input.seed || input.name);
  const silhouette =
    `<circle cx="100" cy="82" r="34" fill="${palette.accent}" />` +
    `<path d="M40,168 C40,128 66,108 100,108 C134,108 160,128 160,168 Z" fill="${palette.accent}" />`;
  return `data:image/svg+xml,${encodeURIComponent(badgeSvg(silhouette, palette))}`;
}

/**
 * A colored monogram badge (initials of `label`) — used in place of a real
 * third-party company/brand logo we can't legitimately fabricate or license.
 */
export function initialsBadgeDataUri(input: { label: string; seed?: string }): string {
  const palette = pickAvatarPalette(input.seed || input.label);
  const initials = initialsOf(input.label);
  const fontSize = initials.length > 2 ? 56 : 68;
  const text =
    `<text x="100" y="100" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" ` +
    `fill="${palette.accent}">${initials}</text>`;
  return `data:image/svg+xml,${encodeURIComponent(badgeSvg(text, palette))}`;
}
