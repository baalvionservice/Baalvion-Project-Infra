/**
 * Hand-built minimal geometric icon set. Every icon is a set of primitive SVG
 * shape descriptors on a 24x24 viewBox, drawn stroke-only (outline style) so the
 * whole platform shares one consistent, original visual language — no clipart,
 * no third-party icon packs, no AI-art look.
 */
export interface IconElement {
  tag: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'ellipse';
  attrs: Record<string, string | number>;
}

export interface IconDef {
  id: string;
  elements: IconElement[];
}

const el = (tag: IconElement['tag'], attrs: IconElement['attrs']): IconElement => ({ tag, attrs });

// ── Finance ──────────────────────────────────────────────────────────────
const house: IconDef = {
  id: 'house',
  elements: [
    el('polyline', { points: '3,11 12,4 21,11' }),
    el('rect', { x: 5, y: 11, width: 14, height: 9 }),
    el('rect', { x: 10, y: 15, width: 4, height: 5 }),
  ],
};

const percent: IconDef = {
  id: 'percent',
  elements: [
    el('circle', { cx: 7, cy: 7, r: 2 }),
    el('circle', { cx: 17, cy: 17, r: 2 }),
    el('line', { x1: 19, y1: 5, x2: 5, y2: 19 }),
  ],
};

const chartUp: IconDef = {
  id: 'chartUp',
  elements: [
    el('polyline', { points: '4,17 9,11 13,14 20,6' }),
    el('polyline', { points: '14,6 20,6 20,12' }),
  ],
};

const chartDown: IconDef = {
  id: 'chartDown',
  elements: [
    el('polyline', { points: '4,7 9,13 13,10 20,18' }),
    el('polyline', { points: '20,12 20,18 14,18' }),
  ],
};

const coinStack: IconDef = {
  id: 'coinStack',
  elements: [
    el('ellipse', { cx: 12, cy: 7, rx: 7, ry: 2.5 }),
    el('ellipse', { cx: 12, cy: 12, rx: 7, ry: 2.5 }),
    el('ellipse', { cx: 12, cy: 17, rx: 7, ry: 2.5 }),
    el('line', { x1: 5, y1: 7, x2: 5, y2: 17 }),
    el('line', { x1: 19, y1: 7, x2: 19, y2: 17 }),
  ],
};

const wallet: IconDef = {
  id: 'wallet',
  elements: [
    el('rect', { x: 3, y: 6, width: 18, height: 13, rx: 2 }),
    el('rect', { x: 14, y: 11, width: 5, height: 5 }),
    el('circle', { cx: 16.5, cy: 13.5, r: 0.8 }),
  ],
};

const bank: IconDef = {
  id: 'bank',
  elements: [
    el('polyline', { points: '4,10 12,4 20,10' }),
    el('line', { x1: 4, y1: 20, x2: 20, y2: 20 }),
    el('line', { x1: 4, y1: 10, x2: 4, y2: 20 }),
    el('line', { x1: 20, y1: 10, x2: 20, y2: 20 }),
    el('line', { x1: 7, y1: 10, x2: 7, y2: 20 }),
    el('line', { x1: 12, y1: 10, x2: 12, y2: 20 }),
    el('line', { x1: 17, y1: 10, x2: 17, y2: 20 }),
  ],
};

const growthArrow: IconDef = {
  id: 'growthArrow',
  elements: [
    el('line', { x1: 4, y1: 20, x2: 4, y2: 4 }),
    el('line', { x1: 4, y1: 20, x2: 20, y2: 20 }),
    el('polyline', { points: '6,14 11,9 14,12 19,6' }),
    el('polyline', { points: '13,6 19,6 19,11' }),
  ],
};

const pieChart: IconDef = {
  id: 'pieChart',
  elements: [
    el('circle', { cx: 12, cy: 12, r: 9 }),
    el('path', { d: 'M12,12 L12,3 A9,9 0 0,1 20,15 Z' }),
  ],
};

const calculator: IconDef = {
  id: 'calculator',
  elements: [
    el('rect', { x: 5, y: 3, width: 14, height: 18, rx: 1.5 }),
    el('rect', { x: 7.5, y: 6, width: 9, height: 4 }),
    el('circle', { cx: 8.5, cy: 14, r: 0.8 }),
    el('circle', { cx: 12, cy: 14, r: 0.8 }),
    el('circle', { cx: 15.5, cy: 14, r: 0.8 }),
    el('circle', { cx: 8.5, cy: 17.5, r: 0.8 }),
    el('circle', { cx: 12, cy: 17.5, r: 0.8 }),
    el('circle', { cx: 15.5, cy: 17.5, r: 0.8 }),
  ],
};

const creditCard: IconDef = {
  id: 'creditCard',
  elements: [
    el('rect', { x: 2, y: 6, width: 20, height: 12, rx: 2 }),
    el('line', { x1: 2, y1: 10, x2: 22, y2: 10 }),
    el('rect', { x: 5, y: 14.5, width: 4, height: 2 }),
  ],
};

const piggyBank: IconDef = {
  id: 'piggyBank',
  elements: [
    el('ellipse', { cx: 12, cy: 13, rx: 8, ry: 6 }),
    el('circle', { cx: 18, cy: 10.5, r: 0.8 }),
    el('line', { x1: 9, y1: 7.5, x2: 12, y2: 7.5 }),
    el('line', { x1: 6, y1: 17, x2: 6, y2: 20 }),
    el('line', { x1: 16, y1: 17, x2: 16, y2: 20 }),
    el('path', { d: 'M20,12 L23,11 L23,15 Z' }),
  ],
};

const invoice: IconDef = {
  id: 'invoice',
  elements: [
    el('rect', { x: 6, y: 2, width: 12, height: 20 }),
    el('line', { x1: 9, y1: 7, x2: 15, y2: 7 }),
    el('line', { x1: 9, y1: 11, x2: 15, y2: 11 }),
    el('line', { x1: 9, y1: 15, x2: 13, y2: 15 }),
  ],
};

// ── Law ──────────────────────────────────────────────────────────────────
const scales: IconDef = {
  id: 'scales',
  elements: [
    el('line', { x1: 12, y1: 3, x2: 12, y2: 20 }),
    el('line', { x1: 4, y1: 7, x2: 20, y2: 7 }),
    el('circle', { cx: 12, cy: 3, r: 1 }),
    el('path', { d: 'M4,7 L2,13 A4,4 0 0,0 6,13 Z' }),
    el('path', { d: 'M20,7 L18,13 A4,4 0 0,0 22,13 Z' }),
    el('line', { x1: 8, y1: 20, x2: 16, y2: 20 }),
  ],
};

const gavel: IconDef = {
  id: 'gavel',
  elements: [
    el('rect', { x: 12.5, y: 3.5, width: 4, height: 7, transform: 'rotate(45 14.5 7)' }),
    el('line', { x1: 11, y1: 8, x2: 16, y2: 13 }),
    el('line', { x1: 5, y1: 14, x2: 10, y2: 19 }),
    el('rect', { x: 3, y: 18, width: 8, height: 3 }),
  ],
};

const courthouse: IconDef = {
  id: 'courthouse',
  elements: [
    el('polyline', { points: '4,9 12,3 20,9' }),
    el('line', { x1: 3, y1: 20, x2: 21, y2: 20 }),
    el('line', { x1: 6, y1: 9, x2: 6, y2: 20 }),
    el('line', { x1: 10, y1: 9, x2: 10, y2: 20 }),
    el('line', { x1: 14, y1: 9, x2: 14, y2: 20 }),
    el('line', { x1: 18, y1: 9, x2: 18, y2: 20 }),
  ],
};

const documentContract: IconDef = {
  id: 'documentContract',
  elements: [
    el('rect', { x: 6, y: 2, width: 12, height: 20 }),
    el('line', { x1: 9, y1: 7, x2: 15, y2: 7 }),
    el('line', { x1: 9, y1: 11, x2: 15, y2: 11 }),
    el('polyline', { points: '9,16 10.5,14.5 11.5,16 13,14 15,16' }),
  ],
};

const handshake: IconDef = {
  id: 'handshake',
  elements: [
    el('polyline', { points: '2,10 7,10 12,15' }),
    el('polyline', { points: '22,10 17,10 12,15' }),
    el('polyline', { points: '9,12 11,10 13,12' }),
    el('line', { x1: 2, y1: 10, x2: 2, y2: 14 }),
    el('line', { x1: 22, y1: 10, x2: 22, y2: 14 }),
  ],
};

const shieldCheck: IconDef = {
  id: 'shieldCheck',
  elements: [
    el('path', { d: 'M12,2 L20,6 V12 C20,17 16,21 12,22 C8,21 4,17 4,12 V6 Z' }),
    el('polyline', { points: '8,12 11,15 16,9' }),
  ],
};

const stamp: IconDef = {
  id: 'stamp',
  elements: [
    el('rect', { x: 4, y: 19, width: 16, height: 2.5 }),
    el('path', { d: 'M8,19 L9.5,11 A2.5,2.5 0 0,1 14.5,11 L16,19 Z' }),
    el('circle', { cx: 12, cy: 8, r: 2.5 }),
  ],
};

const bookStatute: IconDef = {
  id: 'bookStatute',
  elements: [
    el('path', { d: 'M4,4 C7,3 9.5,3 12,4.5 C14.5,3 17,3 20,4 V19 C17,18 14.5,18 12,19.5 C9.5,18 7,18 4,19 Z' }),
    el('line', { x1: 12, y1: 4.5, x2: 12, y2: 19.5 }),
  ],
};

const briefcase: IconDef = {
  id: 'briefcase',
  elements: [
    el('rect', { x: 3, y: 8, width: 18, height: 12, rx: 2 }),
    el('rect', { x: 9, y: 4, width: 6, height: 4, rx: 1 }),
    el('line', { x1: 3, y1: 13, x2: 21, y2: 13 }),
  ],
};

// ── Generic (business / tech, for future categories) ─────────────────────
const server: IconDef = {
  id: 'server',
  elements: [
    el('rect', { x: 4, y: 4, width: 16, height: 6, rx: 1 }),
    el('rect', { x: 4, y: 14, width: 16, height: 6, rx: 1 }),
    el('circle', { cx: 7.5, cy: 7, r: 0.8 }),
    el('circle', { cx: 7.5, cy: 17, r: 0.8 }),
  ],
};

const cloud: IconDef = {
  id: 'cloud',
  elements: [
    el('path', {
      d: 'M7,18 a4,4 0 0 1 0,-8 a5,5 0 0 1 9.6,-2 a4.5,4.5 0 0 1 -0.6,10 Z',
    }),
  ],
};

const database: IconDef = {
  id: 'database',
  elements: [
    el('ellipse', { cx: 12, cy: 5, rx: 8, ry: 2.5 }),
    el('line', { x1: 4, y1: 5, x2: 4, y2: 19 }),
    el('line', { x1: 20, y1: 5, x2: 20, y2: 19 }),
    el('path', { d: 'M4,12 A8,2.5 0 0,0 20,12' }),
    el('path', { d: 'M4,19 A8,2.5 0 0,0 20,19' }),
  ],
};

const apiNode: IconDef = {
  id: 'apiNode',
  elements: [
    el('circle', { cx: 6, cy: 6, r: 2.2 }),
    el('circle', { cx: 18, cy: 6, r: 2.2 }),
    el('circle', { cx: 12, cy: 18, r: 2.2 }),
    el('line', { x1: 7.6, y1: 7.6, x2: 10.6, y2: 16.2 }),
    el('line', { x1: 16.4, y1: 7.6, x2: 13.4, y2: 16.2 }),
    el('line', { x1: 8.2, y1: 6, x2: 15.8, y2: 6 }),
  ],
};

const team: IconDef = {
  id: 'team',
  elements: [
    el('circle', { cx: 9, cy: 8, r: 3 }),
    el('circle', { cx: 16, cy: 9, r: 2.4 }),
    el('path', { d: 'M3,20 C3,15.5 5.7,13 9,13 C12.3,13 15,15.5 15,20' }),
    el('path', { d: 'M14,20 C14,16.5 15.7,14.2 18.5,14.2 C21,14.2 22,16.7 22,20' }),
  ],
};

const report: IconDef = {
  id: 'report',
  elements: [
    el('rect', { x: 5, y: 3, width: 14, height: 18 }),
    el('rect', { x: 8, y: 13, width: 2, height: 5 }),
    el('rect', { x: 11.5, y: 9, width: 2, height: 9 }),
    el('rect', { x: 15, y: 12, width: 2, height: 6 }),
  ],
};

const workflowArrow: IconDef = {
  id: 'workflowArrow',
  elements: [
    el('circle', { cx: 5, cy: 6, r: 2 }),
    el('circle', { cx: 19, cy: 6, r: 2 }),
    el('circle', { cx: 12, cy: 18, r: 2 }),
    el('polyline', { points: '7,6 17,6' }),
    el('polyline', { points: '17.5,7.5 19,6 17.5,4.5' }),
    el('polyline', { points: '10.8,16.4 6.2,7.6' }),
    el('polyline', { points: '13.2,16.4 17.8,7.6' }),
  ],
};

export const FINANCE_ICONS: IconDef[] = [
  house, percent, chartUp, chartDown, coinStack, wallet, bank,
  growthArrow, pieChart, calculator, creditCard, piggyBank, invoice,
];

export const LAW_ICONS: IconDef[] = [
  scales, gavel, courthouse, documentContract, handshake,
  shieldCheck, stamp, bookStatute, briefcase,
];

export const GENERIC_ICONS: IconDef[] = [
  server, cloud, database, apiNode, team, report, workflowArrow,
];

export const ALL_ICONS: IconDef[] = [...FINANCE_ICONS, ...LAW_ICONS, ...GENERIC_ICONS];

const ICON_BY_ID = new Map(ALL_ICONS.map((icon) => [icon.id, icon]));

export function getIcon(id: string): IconDef | undefined {
  return ICON_BY_ID.get(id);
}

/** Render one icon as an SVG <g>, positioned/scaled to occupy a `size`x`size` box at (x, y). */
export function renderIconGroup(icon: IconDef, x: number, y: number, size: number, color: string): string {
  const scale = size / 24;
  const body = icon.elements
    .map((element) => {
      const attrs = Object.entries(element.attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `<${element.tag} ${attrs} />`;
    })
    .join('');
  return (
    `<g transform="translate(${x},${y}) scale(${scale})" ` +
    `stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `${body}</g>`
  );
}
