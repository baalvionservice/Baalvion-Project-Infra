import { getArticles } from '@/modules/content-engine/services/content-service';
import { Article } from '@/modules/content-engine/types';
import { CompanyEntity } from '@/types/entity';

/**
 * @fileOverview Resolves real published articles that mention a given company, for the
 * "Recent News" section on /companies/[slug]. Reuses the same whole-word, case-insensitive
 * name-matching approach already proven by ArticleMarketWidget (src/components/markets),
 * just run in the opposite direction: instead of scanning one article for tracked
 * companies, it scans the recent article set for one company's name.
 *
 * No fabricated content — an empty result renders nothing.
 */

const ARTICLE_SCAN_LIMIT = 60;

function mentionsCompanyName(text: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

export interface CompanyNewsItem {
  slug: string;
  title: string;
  description: string;
  url: string;
  publishedAt?: string;
  authorName?: string;
  authorSlug?: string;
}

function toNewsItem(article: Article): CompanyNewsItem {
  const categoryPath = article.categorySlug ? `/${article.categorySlug}` : '/financial-intelligence';
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    url: `${categoryPath}/${article.slug}`,
    publishedAt: article.publishedAt,
    authorName: article.authorName,
    authorSlug: article.authorSlug,
  };
}

export async function getCompanyRecentNews(company: CompanyEntity, limit = 4): Promise<CompanyNewsItem[]> {
  try {
    const { data: articles } = await getArticles(1, ARTICLE_SCAN_LIMIT);
    const matches = articles.filter(
      (article) =>
        mentionsCompanyName(article.title, company.name) ||
        (article.tags ?? []).some((tag) => mentionsCompanyName(tag, company.name)),
    );
    return matches.slice(0, limit).map(toNewsItem);
  } catch {
    // Never let a news-lookup failure break the company page itself.
    return [];
  }
}
