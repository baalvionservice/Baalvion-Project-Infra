'use strict';

const fs = require('fs');
const path = require('path');

const dataFile = path.resolve(__dirname, 'creator-economy-pillars.data.cjs');

const categoryHeader = `'use strict';
/*
 * Creator Economy Content Pillar & Cluster Master Dataset (Deep Editorial Version)
 * Imperialpedia CMS — All articles saved as DRAFT-ONLY for manual review.
 * Total Articles: 16 In-Depth Guides (1,000–1,800+ words each)
 */

module.exports = {
  categorySlug: 'creator-economy',
  categoryName: 'Creator Economy',
  sources: [
    { name: 'YouTube Help Center — YPP Terms & Policies', url: 'https://support.google.com/youtube/answer/72857' },
    { name: 'Google AdSense Help Center — Publisher Guidelines', url: 'https://support.google.com/adsense' },
    { name: 'Meta Business Help Center — Content Monetization Policies', url: 'https://www.facebook.com/business/help/1348682518563619' },
    { name: 'TikTok Creator Academy — Monetization Guidelines', url: 'https://www.tiktok.com/creators/creator-portal/en-us' },
  ],
`;

console.log('Writing deep articles data generator script...');
