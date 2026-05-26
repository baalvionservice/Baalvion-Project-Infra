/**
 * @fileOverview SEO & Indexing Service Layer.
 */

import { IndexSummary, IndexStatusNode, SitemapStatus } from '@/types/seo';

export const seoService = {
  getIndexSummary: async (): Promise<IndexSummary> => {
    await new Promise(r => setTimeout(r, 400));
    return {
      totalPages: 1248500,
      submittedToSitemap: 1248500,
      indexedPages: 1180400,
      nonIndexedPages: 68100,
      lastSitemapUpdate: '2024-03-15 04:00:00'
    };
  },

  getIndexStatus: async (): Promise<IndexStatusNode[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [
      { url: '/articles/yield-curve-inversion', status: 'Indexed', lastUpdated: '2024-03-14', priority: 0.8 },
      { url: '/glossary/stagflation', status: 'Indexed', lastUpdated: '2024-03-12', priority: 0.7 },
      { url: '/financial-tools/compound-interest', status: 'Pending', lastUpdated: '2024-03-15', priority: 0.9 },
      { url: '/articles/future-of-defi', status: 'Error', lastUpdated: '2024-03-13', priority: 0.8 },
    ];
  },

  getSitemapStatus: async (): Promise<SitemapStatus> => {
    await new Promise(r => setTimeout(r, 300));
    return {
      url: 'https://imperialpedia.com/sitemap.xml',
      lastUpdated: '2024-03-15 04:00:00',
      totalUrls: 1248500,
      status: 'Healthy'
    };
  }
};
