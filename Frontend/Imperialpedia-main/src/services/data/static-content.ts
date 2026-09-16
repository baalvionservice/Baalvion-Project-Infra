/**
 * Fallback static content for local development and offline preview.
 * Includes Creator Economy pillar articles and full backup catalog (499 articles).
 */
import type { CmsPage } from './cms-public';
import { cmsContentToArticle, cmsContentToNews, type CmsContent } from './cms-public';
import type { Article } from '@/modules/content-engine/types/article';
import type { NewsArticle } from '@/lib/data.news';
import creatorEconomyData from '@/generated/creator-economy-content.json';
import imperialpediaBackupData from '@/generated/imperialpedia-backup-content.json';

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
  id: raw.id || raw.slug,
  status: 'published',
  category: { id: 'creator-economy', name: 'Creator Economy', slug: 'creator-economy' },
}));

const rawBackupDocs = Object.values(imperialpediaBackupData as unknown as Record<string, CmsContent>).map((raw) => ({
  ...raw,
  id: raw.id || raw.slug,
  status: raw.status || 'published',
}));

const allRawDocs: CmsContent[] = [...rawCreatorDocs, ...rawBackupDocs];

const allStaticArticles: Article[] = allRawDocs.map((raw) => cmsContentToArticle(raw));
const allStaticNewsArticles: NewsArticle[] = allRawDocs.map((raw) => cmsContentToNews(raw));

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
  return allStaticArticles;
}

export function staticArticleBySlug(slug: string): Article | null {
  const targetSlug = SLUG_ALIASES[slug] || slug;
  return allStaticArticles.find((a) => a.slug === targetSlug) || null;
}

export function staticNewsBySlug(slug: string): NewsArticle | null {
  const targetSlug = SLUG_ALIASES[slug] || slug;
  return allStaticNewsArticles.find((a) => a.slug === targetSlug) || null;
}

export function staticCategoryNews(categorySlug?: string): NewsArticle[] {
  if (!categorySlug) return [];

  // Creator economy specific flow
  if (CREATOR_SLUGS.has(categorySlug)) {
    const creatorNews = allStaticNewsArticles.filter(
      (a) => (a.categorySlug === 'creator-economy' || a.tags?.includes('creator'))
    );
    if (categorySlug === 'creator-economy') return creatorNews;

    const keywordMap: Record<string, string[]> = {
      'youtube-monetization': ['youtube'],
      'instagram-monetization': ['instagram', 'sponsorship', 'brand-deal'],
      'website-monetization': ['website', 'adsense', 'page-rpm'],
      'social-media-earnings': ['tiktok', 'facebook', 'social', 'instagram'],
      'creator-guides': ['income-stream', 'affiliate', 'digital-product', 'sponsorship', 'business'],
      'creator-tools': ['calculator', 'rpm-vs-cpm', 'adsense-page-rpm', 'tool'],
    };

    const keywords = keywordMap[categorySlug] || [];
    if (keywords.length === 0) return creatorNews;

    const primary: NewsArticle[] = [];
    const secondary: NewsArticle[] = [];
    for (const article of creatorNews) {
      const haystack = `${article.title} ${article.slug} ${article.excerpt} ${(article.tags || []).join(' ')}`.toLowerCase();
      if (keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
        primary.push(article);
      } else {
        secondary.push(article);
      }
    }
    return [...primary, ...secondary];
  }

  // General category mapping & aliases
  const aliasMap: Record<string, string> = {
    'scams-and-fraud-protection': 'fraud-protection',
    'cryptocurrency': 'crypto',
    'market-news': 'live-market-news',
  };
  const targetSlug = aliasMap[categorySlug] || categorySlug;

  // 1. Direct category slug match
  const exactMatches = allStaticNewsArticles.filter((article) => {
    const catSlug =
      article.categorySlug ||
      (typeof article.category === 'object' ? (article.category as any)?.slug : undefined) ||
      article.category?.toString().toLowerCase();
    return catSlug === targetSlug || catSlug === categorySlug;
  });

  if (exactMatches.length >= 3) {
    return exactMatches;
  }

  // 2. Keyword fallback for subtopics / fraud / budgeting / stock subpages
  const keywordMap: Record<string, string[]> = {
    'scams-and-fraud-protection': ['fraud', 'scam', 'security', 'protect', 'freeze', 'lock', 'custody', 'safety', 'risk'],
    'fraud-protection': ['fraud', 'scam', 'security', 'protect', 'freeze', 'lock', 'custody', 'safety', 'risk'],
    'budgeting-basics': ['budget', 'saving', 'emergency', 'expense', 'income', 'money'],
    'stocks': ['stock', 'market', 'share', 'dividend', 'trading', 'equity', 'small-cap', 'growth'],
    'investing': ['invest', 'portfolio', 'stock', 'bond', 'fund', 'wealth', 'asset'],
    'trading-strategy': ['trading', 'trade', 'option', 'strategy', 'technical', 'analysis', 'market'],
  };

  const keywords = keywordMap[categorySlug] || targetSlug.split('-').filter((k) => k.length > 2);
  const matched = [...exactMatches];
  const matchedSlugs = new Set(matched.map((a) => a.slug));

  for (const article of allStaticNewsArticles) {
    if (matchedSlugs.has(article.slug)) continue;
    const haystack = `${article.title} ${article.slug} ${article.excerpt} ${(article.tags || []).join(' ')}`.toLowerCase();
    if (keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
      matched.push(article);
    }
  }

  return matched.length > 0 ? matched : allStaticNewsArticles.slice(0, 15);
}

export function staticPageBySlug(_slug: string): CmsPage | null {
  return null;
}
