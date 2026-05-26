/**
 * @fileOverview Centralized registry for all indexable content in GeoTrade Nexus.
 * This file serves as the source of truth for the Sitemap and SEO systems.
 */

export interface SitemapEntry {
  slug: string;
  lastMod: string;
  priority: number;
}

export const SITEMAP_BASE_URL = 'https://mining.baalvion.com';

export const products: SitemapEntry[] = [
  { slug: 'iron-ore-fine', lastMod: '2024-05-20', priority: 0.7 },
  { slug: 'copper-cathodes', lastMod: '2024-05-19', priority: 0.7 },
  { slug: 'lithium-spodumene', lastMod: '2024-05-18', priority: 0.7 },
  { slug: 'gold-bullion', lastMod: '2024-05-17', priority: 0.7 },
  { slug: 'manganese-ore', lastMod: '2024-05-16', priority: 0.7 },
  { slug: 'cobalt-hydroxide', lastMod: '2024-05-15', priority: 0.7 },
];

export const suppliers: SitemapEntry[] = [
  { slug: 'atlas-mining-co', lastMod: '2024-05-20', priority: 0.7 },
  { slug: 'zambia-copper-ltd', lastMod: '2024-05-18', priority: 0.7 },
  { slug: 'sinotrade-minerals', lastMod: '2024-05-15', priority: 0.7 },
  { slug: 'andean-silver-corp', lastMod: '2024-05-12', priority: 0.7 },
];

export const blogPosts: SitemapEntry[] = [
  { slug: 'rise-of-critical-minerals-2024', lastMod: '2024-05-12', priority: 0.6 },
  { slug: 'ai-in-mining-beyond-hype', lastMod: '2024-05-10', priority: 0.6 },
  { slug: 'navigating-cross-border-logistics', lastMod: '2024-05-05', priority: 0.6 },
];

export const guides: SitemapEntry[] = [
  { slug: 'lithium-export-compliance-guide', lastMod: '2024-05-21', priority: 0.8 },
  { slug: 'copper-purity-standards-handbook', lastMod: '2024-05-20', priority: 0.8 },
  { slug: 'bulk-logistics-optimization-report', lastMod: '2024-05-19', priority: 0.8 },
  { slug: 'responsible-mining-certification-pathway', lastMod: '2024-05-18', priority: 0.8 },
];

export const tradePages: SitemapEntry[] = [
  { slug: 'iron-ore-suppliers-brazil', lastMod: '2024-05-22', priority: 0.8 },
  { slug: 'lithium-exporters-australia', lastMod: '2024-05-22', priority: 0.8 },
  { slug: 'copper-concentrate-producers-chile', lastMod: '2024-05-22', priority: 0.8 },
  { slug: 'cobalt-suppliers-africa', lastMod: '2024-05-22', priority: 0.8 }
];
