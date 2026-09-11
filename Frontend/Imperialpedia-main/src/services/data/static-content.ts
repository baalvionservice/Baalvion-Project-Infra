/**
 * Fallback static content for local development and offline preview.
 * Includes the newly drafted Creator Economy pillar and cluster articles.
 */
import type { CmsPage } from './cms-public';
import { cmsContentToArticle, cmsContentToNews, type CmsContent } from './cms-public';
import type { Article } from '@/modules/content-engine/types/article';
import type { NewsArticle } from '@/lib/data.news';
import creatorEconomyData from '@/generated/creator-economy-content.json';

const CREATOR_SLUGS = new Set([
  'creator-economy',
  'youtube-monetization',
  'instagram-monetization',
  'website-monetization',
  'social-media-earnings',
  'creator-guides',
  'creator-tools',
]);

const rawCreatorDocs = (creatorEconomyData as unknown as CmsContent[]).map((raw) => ({
  ...raw,
  id: raw.slug,
  status: 'published',
  category: { id: 'creator-economy', name: 'Creator Economy', slug: 'creator-economy' },
}));

const creatorArticles: Article[] = rawCreatorDocs.map((raw) => cmsContentToArticle(raw));
const creatorNewsArticles: NewsArticle[] = rawCreatorDocs.map((raw) => cmsContentToNews(raw));

const SLUG_ALIASES: Record<string, string> = {
  'how-instagram-subscriptions-work-for-creators': 'instagram-creator-subscriptions-and-reel-bonus-rules',
  'how-much-does-youtube-pay-per-1000-views': 'ad-revenue-sharing-models-and-cpm-trends',
  'how-to-build-multiple-creator-income-streams': 'diversifying-income-sponsorships-ad-revenue-digital-goods',
  'how-creator-sponsorships-and-brand-deals-work': 'youtube-partner-program-vs-direct-brand-deals',
  'how-instagram-pays-creators': 'benchmarking-instagram-creator-sponsorship-rates',
  'how-much-do-youtube-shorts-pay': 'youtube-shorts-monetization-vs-long-form-payout-rates',
  'how-google-adsense-works': 'adsense-payment-schedules-and-threshold-rules',
  'how-much-can-a-website-earn-from-100000-monthly-visitors': 'display-ad-networks-mediavine-vs-raptive-vs-ezoic',
  'how-affiliate-marketing-works-for-content-creators': 'affiliate-marketing-commission-structures-and-tracking',
  'how-google-adsense-page-rpm-is-calculated': 'calculating-page-rpm-and-session-revenue',
  'how-much-do-tiktok-creators-make': 'cross-platform-payout-comparison-tiktok-youtube-and-x',
  'how-much-do-facebook-creators-earn': 'how-platform-creator-funds-calculate-rpm',
  'how-youtube-channel-memberships-work': 'taxes-for-creators-deductions-quarterly-estimates-and-llcs',
  'how-to-price-digital-products-as-a-creator': 'sponsored-post-rate-benchmarks-for-micro-influencers',
};

export function staticArticleList(): Article[] {
  return creatorArticles;
}

export function staticArticleBySlug(slug: string): Article | null {
  const targetSlug = SLUG_ALIASES[slug] || slug;
  return creatorArticles.find((a) => a.slug === targetSlug) || null;
}

export function staticNewsBySlug(slug: string): NewsArticle | null {
  const targetSlug = SLUG_ALIASES[slug] || slug;
  return creatorNewsArticles.find((a) => a.slug === targetSlug) || null;
}

export function staticCategoryNews(categorySlug?: string): NewsArticle[] {
  if (!categorySlug || !CREATOR_SLUGS.has(categorySlug)) {
    return [];
  }

  if (categorySlug === "creator-economy") {
    return creatorNewsArticles;
  }

  // Topic specific keyword matchers
  const keywordMap: Record<string, string[]> = {
    "youtube-monetization": ["youtube"],
    "instagram-monetization": ["instagram", "sponsorship", "brand-deal"],
    "website-monetization": ["website", "adsense", "page-rpm"],
    "social-media-earnings": ["tiktok", "facebook", "social", "instagram"],
    "creator-guides": ["income-stream", "affiliate", "digital-product", "sponsorship", "business"],
    "creator-tools": ["calculator", "rpm-vs-cpm", "adsense-page-rpm", "tool"],
  };

  const keywords = keywordMap[categorySlug] || [];
  if (keywords.length === 0) {
    return creatorNewsArticles;
  }

  const primary: NewsArticle[] = [];
  const secondary: NewsArticle[] = [];

  for (const article of creatorNewsArticles) {
    const haystack = `${article.title} ${article.slug} ${article.excerpt} ${(article.tags || []).join(" ")}`.toLowerCase();
    const isMatch = keywords.some((kw) => haystack.includes(kw.toLowerCase()));
    if (isMatch) {
      primary.push(article);
    } else {
      secondary.push(article);
    }
  }

  return [...primary, ...secondary];
}

export function staticPageBySlug(_slug: string): CmsPage | null {
  return null;
}
