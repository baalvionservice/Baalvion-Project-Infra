import { env } from '@/config/env';

/**
 * @fileOverview Static sitemap generator for Phase 1.
 * This will be expanded in Phase 2 to include 1M+ dynamic entity nodes.
 */

export const generateSitemap = () => {
  const baseUrl = env.siteUrl || 'https://imperialpedia.com';
  
  const pages = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/#features', changefreq: 'weekly', priority: 0.8 },
    { url: '/#faq', changefreq: 'weekly', priority: 0.8 },
    { url: '/#pricing', changefreq: 'weekly', priority: 0.8 },
    { url: '/creators', changefreq: 'daily', priority: 0.9 },
    { url: '/glossary', changefreq: 'daily', priority: 0.9 },
    { url: '/financial-tools', changefreq: 'monthly', priority: 0.7 },
    { url: '/explore', changefreq: 'daily', priority: 0.9 },
    { url: '/ai-analyst', changefreq: 'daily', priority: 0.9 },
  ];

  const xmlEntries = pages
    .map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
  <!-- TODO: Auto-generate sitemap entries for AI-generated entity pages in Phase 2 -->
  <!-- TODO: AI-powered dynamic sitemap prioritization -->
  <!-- TODO: Automated submission to search engine discovery nodes -->
</urlset>`.trim();
};
