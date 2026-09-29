/**
 * Brand theme registry. The shared auth surface renders in the theme of whichever Baalvion site
 * the user came from, so the experience feels native — not a separate generic login page.
 *
 * A theme is a flat map of CSS custom properties applied to the auth card's root. Every component
 * styles itself purely from these tokens (var(--accent), var(--surface), …), so adding a brand is
 * just adding one entry here — no component changes.
 *
 * Verified flagship tokens come straight from the live sites:
 *   • baalvion.com   — dark "ledger" institutional, Fraunces + Inter Tight + IBM Plex Mono, #FF9900.
 *   • about.baalvion — light, Inter, shadcn surfaces, #FF9900 primary.
 * The shared Baalvion orange (#FF9900) is the through-line across every brand.
 */
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  /** Stable slug used in ?brand= and to match return_to hostnames. */
  slug: string;
  /** Wordmark shown above the form. */
  brandName: string;
  /** Short line under the wordmark. */
  tagline: string;
  mode: ThemeMode;
  /** CSS custom properties applied to the auth card root. */
  vars: Record<string, string>;
}

// Shared scaffolding so brands only override what differs.
const SHARED = {
  '--font-body': 'var(--font-inter)',
  '--font-display': 'var(--font-inter)',
  '--font-mono': 'var(--font-plex-mono)',
  '--ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--dur': '300ms',
};

const THEMES: Record<string, Theme> = {
  // ── Apex flagship: baalvion.com — dark institutional ledger ──────────────────────
  baalvion: {
    slug: 'baalvion',
    brandName: 'Baalvion',
    tagline: 'Global infrastructure intelligence',
    mode: 'dark',
    vars: {
      ...SHARED,
      '--font-display': 'var(--font-fraunces)',
      '--font-body': 'var(--font-inter-tight)',
      '--bg': '#06080b',
      '--bg-grad-1': '#0a0d13',
      '--bg-grad-2': '#06080b',
      '--surface': '#10141a',
      '--surface-2': '#171c24',
      '--text': '#f6f5f3',
      '--text-strong': '#ece8e1',
      '--text-muted': '#99a1ad',
      '--accent': '#ff9900',
      '--accent-hover': '#cc7a00',
      '--accent-contrast': '#06080b',
      '--border': 'rgba(255,255,255,0.10)',
      '--border-strong': 'rgba(255,255,255,0.18)',
      '--ring': 'rgba(255,153,0,0.45)',
      '--field-bg': '#0c1015',
      '--radius': '6px',
      '--shadow': '0 24px 60px -20px rgba(0,0,0,0.7)',
    },
  },

  // ── about.baalvion.com — light, Inter, orange primary (shadcn surfaces) ───────────
  about: {
    slug: 'about',
    brandName: 'Baalvion',
    tagline: 'Stories, press & guidance',
    mode: 'light',
    vars: {
      ...SHARED,
      '--bg': '#ffffff',
      '--bg-grad-1': '#fff7ed',
      '--bg-grad-2': '#ffffff',
      '--surface': '#ffffff',
      '--surface-2': '#f8f8f8',
      '--text': '#121212',
      '--text-strong': '#0a0a0a',
      '--text-muted': '#666666',
      '--accent': '#ff9900',
      '--accent-hover': '#e68a00',
      '--accent-contrast': '#ffffff',
      '--border': '#e5e7eb',
      '--border-strong': '#d4d4d8',
      '--ring': 'rgba(255,153,0,0.35)',
      '--field-bg': '#ffffff',
      '--radius': '8px',
      '--shadow': '0 20px 50px -24px rgba(0,0,0,0.25)',
    },
  },

  // ── Amarisé Maison Avenue — light luxury, serif display, monochrome primary ───────
  amarise: {
    slug: 'amarise',
    brandName: 'Amarisé',
    tagline: 'Maison Avenue',
    mode: 'light',
    vars: {
      ...SHARED,
      '--font-display': 'var(--font-cormorant)',
      '--bg': '#ffffff',
      '--bg-grad-1': '#f5f5f5',
      '--surface': '#ffffff',
      '--surface-2': '#f5f5f5',
      '--text': '#333333',
      '--text-strong': '#1a1a1a',
      '--text-muted': '#666666',
      '--accent': '#1a1a1a',
      '--accent-hover': '#000000',
      '--accent-contrast': '#ffffff',
      '--border': '#e5e5e5',
      '--field-bg': '#ffffff',
      '--radius': '4px',
    },
  },

  // ── Control The Market — light, Space Grotesk, sky-blue ───────────────────────────
  ctm: {
    slug: 'ctm',
    brandName: 'Control The Market',
    tagline: 'Markets infrastructure',
    mode: 'light',
    vars: {
      ...SHARED,
      '--font-display': 'var(--font-space-grotesk)',
      '--bg': '#f0f2f5',
      '--bg-grad-1': '#e3eef6',
      '--surface': '#ffffff',
      '--surface-2': '#f5f5f5',
      '--text': '#3d3d3d',
      '--text-strong': '#1a1a1a',
      '--text-muted': '#7d7d7d',
      '--accent': '#5fa8d3',
      '--accent-hover': '#4a8cc1',
      '--accent-contrast': '#ffffff',
      '--border': '#d9d9d9',
      '--field-bg': '#ffffff',
      '--radius': '8px',
    },
  },

  // ── Proxy (proxy.baalvionstack.com) — dark, mint-green ────────────────────────────
  proxy: {
    slug: 'proxy',
    brandName: 'Baalvion Proxy',
    tagline: 'The proxy stack',
    mode: 'dark',
    vars: {
      ...SHARED,
      '--bg': '#0f1419',
      '--bg-grad-1': '#13202022',
      '--surface': '#141a24',
      '--surface-2': '#1a2032',
      '--text': '#f8f9fa',
      '--text-strong': '#f8f9fa',
      '--text-muted': '#8d95a8',
      '--accent': '#39e5a8',
      '--accent-hover': '#2cd9a0',
      '--accent-contrast': '#0f1419',
      '--border': '#262f3d',
      '--field-bg': '#0c1015',
      '--radius': '12px',
    },
  },

  // ── Global Trade Infrastructure (trade.baalvion.com) — dark, blue ─────────────────
  gti: {
    slug: 'gti',
    brandName: 'Baalvion Trade',
    tagline: 'Global trade infrastructure',
    mode: 'dark',
    vars: {
      ...SHARED,
      '--font-mono': 'var(--font-jetbrains-mono)',
      '--bg': '#020617',
      '--bg-grad-1': '#0f172a',
      '--surface': '#0d1421',
      '--surface-2': '#1a2540',
      '--text': '#faf8f6',
      '--text-strong': '#faf8f6',
      '--text-muted': '#a6b4d0',
      '--accent': '#5b9efd',
      '--accent-hover': '#4084d9',
      '--accent-contrast': '#ffffff',
      '--border': '#2d3d5a',
      '--field-bg': '#0a1120',
      '--radius': '14px',
    },
  },

  // ── IR (ir.baalvion.com) — dark, orange ───────────────────────────────────────────
  ir: {
    slug: 'ir',
    brandName: 'Baalvion IR',
    tagline: 'Investor relations',
    mode: 'dark',
    vars: {
      ...SHARED,
      '--bg': '#050607',
      '--bg-grad-1': '#1a1620',
      '--surface': '#191d28',
      '--surface-2': '#282d3a',
      '--text': '#faf8f6',
      '--text-strong': '#faf8f6',
      '--text-muted': '#a6acb5',
      '--accent': '#f97316',
      '--accent-hover': '#dc7911',
      '--accent-contrast': '#0a0a0a',
      '--border': '#333847',
      '--field-bg': '#101420',
      '--radius': '8px',
    },
  },

  // ── Imperialpedia — light editorial, serif display, royal blue ────────────────────
  imperialpedia: {
    slug: 'imperialpedia',
    brandName: 'Imperialpedia',
    tagline: 'The knowledge base',
    mode: 'light',
    vars: {
      ...SHARED,
      '--font-display': "Georgia, 'Times New Roman', serif",
      '--bg': '#ffffff',
      '--bg-grad-1': '#eef2fb',
      '--surface': '#ffffff',
      '--surface-2': '#f4f4f4',
      '--text': '#1f1f1f',
      '--text-strong': '#1f1f1f',
      '--text-muted': '#666666',
      '--accent': '#1d4fc4',
      '--accent-hover': '#163da6',
      '--accent-contrast': '#ffffff',
      '--border': '#e3e3e3',
      '--field-bg': '#ffffff',
      '--radius': '4px',
    },
  },

  // ── Law Elite Network — light, royal blue ─────────────────────────────────────────
  law: {
    slug: 'law',
    brandName: 'Law Elite Network',
    tagline: 'The legal network',
    mode: 'light',
    vars: {
      ...SHARED,
      '--bg': '#ffffff',
      '--bg-grad-1': '#eef3ff',
      '--surface': '#ffffff',
      '--surface-2': '#f8fafc',
      '--text': '#1a202c',
      '--text-strong': '#1a202c',
      '--text-muted': '#718096',
      '--accent': '#2563eb',
      '--accent-hover': '#1e40af',
      '--accent-contrast': '#ffffff',
      '--border': '#e2e8f0',
      '--field-bg': '#ffffff',
      '--radius': '12px',
    },
  },

  // ── Mining (mining.baalvion.com) — light, cyan ────────────────────────────────────
  mining: {
    slug: 'mining',
    brandName: 'Baalvion Mining',
    tagline: 'Resource infrastructure',
    mode: 'light',
    vars: {
      ...SHARED,
      '--bg': '#ecf0f5',
      '--bg-grad-1': '#dcf4f6',
      '--surface': '#ffffff',
      '--surface-2': '#f0f5fa',
      '--text': '#1a1f2e',
      '--text-strong': '#1a1f2e',
      '--text-muted': '#768fa8',
      '--accent': '#21cedd',
      '--accent-hover': '#1ba3a8',
      '--accent-contrast': '#08222a',
      '--border': '#d9e2ed',
      '--field-bg': '#ffffff',
      '--radius': '12px',
    },
  },

  // ── Jobs (jobs.baalvion.com) — light, blue ────────────────────────────────────────
  jobs: {
    slug: 'jobs',
    brandName: 'Baalvion Jobs',
    tagline: 'Careers & talent',
    mode: 'light',
    vars: {
      ...SHARED,
      '--bg': '#f3f6f9',
      '--bg-grad-1': '#e7effb',
      '--surface': '#ffffff',
      '--surface-2': '#f3f6f9',
      '--text': '#1f2937',
      '--text-strong': '#1f2937',
      '--text-muted': '#6b7280',
      '--accent': '#3b82f6',
      '--accent-hover': '#2563eb',
      '--accent-contrast': '#ffffff',
      '--border': '#e5e7eb',
      '--field-bg': '#ffffff',
      '--radius': '8px',
    },
  },

  // ── Company Unified Dashboard — light, blue ───────────────────────────────────────
  dashboard: {
    slug: 'dashboard',
    brandName: 'Baalvion Dashboard',
    tagline: 'Your company workspace',
    mode: 'light',
    vars: {
      ...SHARED,
      '--bg': '#f7f8fc',
      '--bg-grad-1': '#e9f1f8',
      '--surface': '#ffffff',
      '--surface-2': '#e8eaef',
      '--text': '#0f1419',
      '--text-strong': '#0f1419',
      '--text-muted': '#6b7280',
      '--accent': '#4a9dcc',
      '--accent-hover': '#2b7fa3',
      '--accent-contrast': '#ffffff',
      '--border': '#e5e7eb',
      '--field-bg': '#ffffff',
      '--radius': '8px',
    },
  },

  // ── Brand Connector (connect.baalvion.com) — light, Plus Jakarta Sans, violet ─────
  'brand-connector': {
    slug: 'brand-connector',
    brandName: 'Baalvion Connect',
    tagline: 'The brand network',
    mode: 'light',
    vars: {
      ...SHARED,
      '--font-display': 'var(--font-jakarta)',
      '--bg': '#f9fafb',
      '--bg-grad-1': '#f1ecff',
      '--surface': '#ffffff',
      '--surface-2': '#fafbfc',
      '--text': '#1a202c',
      '--text-strong': '#1a202c',
      '--text-muted': '#718096',
      '--accent': '#9d6bff',
      '--accent-hover': '#7c4fd9',
      '--accent-contrast': '#ffffff',
      '--border': '#e2e8f0',
      '--field-bg': '#ffffff',
      '--radius': '12px',
    },
  },

  // ── Admin Platform (admin.baalvion.com) — light, blue ─────────────────────────────
  admin: {
    slug: 'admin',
    brandName: 'Baalvion Admin',
    tagline: 'Platform administration',
    mode: 'light',
    vars: {
      ...SHARED,
      '--bg': '#ffffff',
      '--bg-grad-1': '#eef3ff',
      '--surface': '#ffffff',
      '--surface-2': '#f8fafc',
      '--text': '#0f172a',
      '--text-strong': '#0f172a',
      '--text-muted': '#64748b',
      '--accent': '#3b82f6',
      '--accent-hover': '#1d4ed8',
      '--accent-contrast': '#ffffff',
      '--border': '#e2e8f0',
      '--field-bg': '#ffffff',
      '--radius': '8px',
    },
  },
};

// Default theme when the brand is unknown: the dark flagship (apex Baalvion identity).
export const DEFAULT_THEME = THEMES.baalvion;

/**
 * Map of return_to hostnames → brand slug. Lets us infer the right theme from where the user came
 * from even when ?brand= is absent. Extend as sites are wired in Phase 3.
 */
export const HOST_BRAND: Record<string, string> = {
  'baalvion.com': 'baalvion',
  'www.baalvion.com': 'baalvion',
  'about.baalvion.com': 'about',
  'amarisemaisonavenue.com': 'amarise',
  'www.amarisemaisonavenue.com': 'amarise',
  'controlthemarket.com': 'ctm',
  'proxy.baalvionstack.com': 'proxy',
  'trade.baalvion.com': 'gti',
  'ir.baalvion.com': 'ir',
  'imperialpedia.com': 'imperialpedia',
  'www.imperialpedia.com': 'imperialpedia',
  'lawelitenetwork.com': 'law',
  'www.lawelitenetwork.com': 'law',
  'mining.baalvion.com': 'mining',
  'jobs.baalvion.com': 'jobs',
  'connect.baalvion.com': 'brand-connector',
  'admin.baalvion.com': 'admin',
};

export function getTheme(slug: string | undefined | null): Theme {
  if (!slug) return DEFAULT_THEME;
  return THEMES[slug.toLowerCase()] || DEFAULT_THEME;
}

export function themeForHost(host: string | undefined | null): Theme {
  if (!host) return DEFAULT_THEME;
  return getTheme(HOST_BRAND[host.toLowerCase()]);
}

export { THEMES };
