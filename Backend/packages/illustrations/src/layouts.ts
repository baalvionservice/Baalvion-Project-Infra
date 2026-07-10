import type { IconDef } from './icons';
import { renderIconGroup } from './icons';
import type { Palette } from './palette';

export interface LayoutInput {
  icons: IconDef[];
  palette: Palette;
  kicker: string;
}

const WIDTH = 800;
const HEIGHT = 600;

function svgShell(palette: Palette, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img">` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${palette.bgFrom}" />` +
    `<stop offset="100%" stop-color="${palette.bgTo}" />` +
    `</linearGradient></defs>` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />` +
    `${body}</svg>`
  );
}

// Category names like "Business & Corporate" contain raw XML special characters —
// without escaping, the emitted SVG is invalid XML. This was previously masked
// because the SVG was only ever consumed as a data-URI string (lenient browser
// parsing), but strict XML parsers (e.g. librsvg, used by sharp for rasterization)
// reject it outright.
function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function kickerText(kicker: string, palette: Palette, x: number, y: number): string {
  const label = escapeXmlText(kicker.toUpperCase());
  return (
    `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="20" ` +
    `font-weight="700" letter-spacing="2" fill="${palette.accent}">${label}</text>`
  );
}

function iconLeftTextRight({ icons, palette, kicker }: LayoutInput): string {
  const primary = icons[0];
  const rest = icons.slice(1, 3);
  const parts = [renderIconGroup(primary, 90, 190, 220, palette.accent)];
  rest.forEach((icon, i) => {
    parts.push(renderIconGroup(icon, 520 + i * 110, 400, 90, palette.ink));
  });
  parts.push(kickerText(kicker, palette, 90, 130));
  parts.push(`<line x1="480" y1="80" x2="480" y2="520" stroke="${palette.accent}" stroke-width="2" opacity="0.25" />`);
  return svgShell(palette, parts.join(''));
}

function iconGrid({ icons, palette, kicker }: LayoutInput): string {
  const positions: Array<[number, number, number]> = [
    [140, 160, 170],
    [460, 140, 150],
    [300, 380, 160],
  ];
  const parts = icons
    .slice(0, 3)
    .map((icon, i) => renderIconGroup(icon, positions[i][0], positions[i][1], positions[i][2], i === 0 ? palette.accent : palette.ink));
  parts.push(kickerText(kicker, palette, 60, 60));
  return svgShell(palette, parts.join(''));
}

function centerBadge({ icons, palette, kicker }: LayoutInput): string {
  const primary = icons[0];
  const parts = [
    `<circle cx="400" cy="270" r="150" fill="${palette.bgTo}" stroke="${palette.accent}" stroke-width="3" opacity="0.9" />`,
    renderIconGroup(primary, 300, 170, 200, palette.accent),
    kickerText(kicker, palette, 400 - kicker.length * 6, 480),
  ];
  const rest = icons.slice(1, 3);
  rest.forEach((icon, i) => {
    parts.push(renderIconGroup(icon, 60 + i * 620, 60, 70, palette.ink));
  });
  return svgShell(palette, parts.join(''));
}

function chartBand({ icons, palette, kicker }: LayoutInput): string {
  const parts = [
    kickerText(kicker, palette, 60, 90),
    `<polyline points="60,460 220,380 360,420 520,300 700,220" fill="none" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.55" />`,
  ];
  const primary = icons[0];
  parts.push(renderIconGroup(primary, 560, 140, 170, palette.accent));
  const rest = icons.slice(1, 3);
  rest.forEach((icon, i) => {
    parts.push(renderIconGroup(icon, 100 + i * 160, 200, 100, palette.ink));
  });
  return svgShell(palette, parts.join(''));
}

function diagonalSplit({ icons, palette, kicker }: LayoutInput): string {
  const parts = [
    `<polygon points="0,600 800,0 800,600" fill="${palette.accent}" opacity="0.08" />`,
    kickerText(kicker, palette, 60, 100),
  ];
  const primary = icons[0];
  parts.push(renderIconGroup(primary, 470, 220, 190, palette.accent));
  const rest = icons.slice(1, 3);
  rest.forEach((icon, i) => {
    parts.push(renderIconGroup(icon, 100 + i * 120, 400, 100, palette.ink));
  });
  return svgShell(palette, parts.join(''));
}

export const LAYOUTS = [iconLeftTextRight, iconGrid, centerBadge, chartBand, diagonalSplit] as const;
