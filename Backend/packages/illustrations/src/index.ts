import { djb2 } from './hash';
import { resolveIcons, type ArticleInput } from './keywords';
import { paletteGroupForCategory, type Palette } from './palette';
import { LAYOUTS, type LayoutInput } from './layouts';

export type { ArticleInput } from './keywords';
export { FINANCE_ICONS, LAW_ICONS, GENERIC_ICONS, ALL_ICONS } from './icons';
export { FINANCE_PALETTES, LAW_PALETTES, NEUTRAL_PALETTES } from './palette';
export { personSilhouetteDataUri, initialsBadgeDataUri } from './avatars';

const ICON_LABELS: Record<string, string> = {
  house: 'a house', percent: 'a percentage rate', chartUp: 'an upward trend chart',
  chartDown: 'a downward trend chart', coinStack: 'a stack of coins', wallet: 'a wallet',
  bank: 'a bank building', growthArrow: 'a growth arrow', pieChart: 'a pie chart',
  calculator: 'a calculator', creditCard: 'a credit card', piggyBank: 'a piggy bank',
  invoice: 'an invoice', scales: 'scales of justice', gavel: 'a gavel', courthouse: 'a courthouse',
  documentContract: 'a signed contract', handshake: 'a handshake', shieldCheck: 'a compliance shield',
  stamp: 'an official stamp', bookStatute: 'a statute book', briefcase: 'a briefcase',
  server: 'a server', cloud: 'a cloud', database: 'a database', apiNode: 'connected nodes',
  team: 'a team', report: 'a bar chart report', workflowArrow: 'a workflow diagram',
};

export interface GeneratedArt {
  svg: string;
  altText: string;
  dominantColor: string;
}

function buildAltText(input: ArticleInput, iconIds: string[]): string {
  const concepts = iconIds.map((id) => ICON_LABELS[id] || id).join(', ');
  return `Illustration showing ${concepts} for "${input.title}"`;
}

/** Pure — no filesystem access. Deterministic: identical input always produces identical output. */
export function generateArticleArt(input: ArticleInput): GeneratedArt {
  const icons = resolveIcons(input);
  // Both arrays are non-empty by construction (see palette.ts / layouts.ts), so the
  // modulo index always resolves — the `as` narrows past noUncheckedIndexedAccess.
  const paletteGroup = paletteGroupForCategory(input.category);
  const paletteHash = djb2(`${input.seed}:palette`);
  const palette = paletteGroup[paletteHash % paletteGroup.length] as Palette;
  const layoutHash = djb2(`${input.seed}:layout`);
  const layout = LAYOUTS[layoutHash % LAYOUTS.length] as (i: LayoutInput) => string;
  const kicker = (input.category || 'Editorial').slice(0, 28);

  const svg = layout({ icons, palette, kicker });
  const iconIds = icons.map((icon) => icon.id);
  return {
    svg,
    altText: buildAltText(input, iconIds),
    dominantColor: palette.accent,
  };
}

/** Node-only: writes the generated SVG to `absOutPath`, creating parent directories as needed. */
export function writeArticleArtFile(input: ArticleInput, absOutPath: string): GeneratedArt {
  // Deliberately required lazily so this module stays importable in bundlers/runtimes
  // (e.g. edge) that only ever call the pure generateArticleArt()/articleArtDataUri().
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path') as typeof import('path');

  const art = generateArticleArt(input);
  fs.mkdirSync(path.dirname(absOutPath), { recursive: true });
  fs.writeFileSync(absOutPath, art.svg, 'utf8');
  return art;
}

/**
 * Node-only: rasterizes the generated SVG to a PNG and writes it to `absOutPath`.
 * Social crawlers (Facebook/Twitter/Google News) need a real crawlable raster
 * `og:image`/`NewsArticle.image` — SVG data URIs are not reliably accepted. Defaults
 * to 1200x630 (the standard OG image size); the 800x600 source viewBox is abstract
 * geometric art, so a `cover` crop to a wider aspect ratio is visually safe.
 */
export async function writeArticleArtRaster(
  input: ArticleInput,
  absOutPath: string,
  size: { width: number; height: number } = { width: 1200, height: 630 },
): Promise<GeneratedArt> {
  // Required lazily, same reasoning as writeArticleArtFile above — keeps sharp (a
  // native Node addon) out of any bundler graph that only needs the pure SVG/data-URI
  // helpers.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path') as typeof import('path');
  // `typeof import('sharp')` resolves via sharp's dual ESM/CJS `exports` map (sharp
  // >=0.35 ships both), and TS picks that up ambiguously against the plain `require()`
  // call actually made here — resolving to the ESM namespace type (no call signature)
  // rather than the CJS default export TS sees at runtime. require() itself already
  // returns `any`, so this cast added type-checking only; drop it rather than fight the
  // dual-package hazard.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sharp = require('sharp');

  const art = generateArticleArt(input);
  fs.mkdirSync(path.dirname(absOutPath), { recursive: true });
  await sharp(Buffer.from(art.svg))
    .resize(size.width, size.height, { fit: 'cover' })
    .png()
    .toFile(absOutPath);
  return art;
}

/** Isomorphic (no fs): a self-contained inline image, safe for `<img src>` anywhere. */
export function articleArtDataUri(input: ArticleInput): string {
  const { svg } = generateArticleArt(input);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
