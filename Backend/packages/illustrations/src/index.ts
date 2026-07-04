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

/** Isomorphic (no fs): a self-contained inline image, safe for `<img src>` anywhere. */
export function articleArtDataUri(input: ArticleInput): string {
  const { svg } = generateArticleArt(input);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
