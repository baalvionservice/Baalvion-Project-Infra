import { Article } from '@/modules/content-engine/types';
import { FAQ } from '../models/faq';
import { structuredData } from '@/lib/seo/structured-data';
import type { ResolvedAuthor } from '@/services/data/cms-public';
import { env } from '@/config/env';

/**
 * @fileOverview Specialized service for generating pSEO-optimized JSON-LD schemas.
 */
export const schemaService = {
  /**
   * Generates FAQPage schema for a set of questions.
   */
  generateFAQSchema: (faqs: FAQ[]) => {
    return structuredData.faq(faqs.map(f => ({ question: f.question, answer: f.answer })));
  },
  
  /**
   * Generates Article schema for content engine articles. Pass the resolved reviewer
   * profile (from cms-public.resolveAuthor(article.reviewerSlug)) to emit `reviewedBy` —
   * the E-E-A-T editorial-review signal for YMYL finance content.
   */
  generateArticleSchema: (article: Article, reviewer?: ResolvedAuthor | null) => {
    const base = {
      title: article.title,
      description: article.description,
      image: article.featuredImage || '',
      authorName:
        article.authorName ||
        (article.authorId === 'creator-1' ? 'The Market Maven' : 'Imperialpedia Expert'),
      datePublished: article.publishedAt || new Date().toISOString(),
      dateModified: article.updatedAt,
      reviewedBy: reviewer
        ? { name: reviewer.name, url: `${env.siteUrl}/authors/${reviewer.slug}` }
        : undefined,
    };
    const schema =
      article.contentType === 'news' ? structuredData.newsArticle(base) : structuredData.article(base);
    // Voice/AI-assistant readability — points speakable extraction at the
    // headline + description so assistants can read a short summary aloud.
    return { ...schema, speakable: structuredData.speakable() };
  },

  /**
   * Generates SoftwareApplication schema for financial calculators and tools.
   */
  generateToolSchema: (tool: any) => {
    return structuredData.softwareApp({
      name: tool.name,
      description: tool.description,
      url: `https://imperialpedia.com/calculators/${tool.slug}`,
      category: 'FinanceApplication',
    });
  }
};
