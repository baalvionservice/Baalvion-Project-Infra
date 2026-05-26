import { Article } from '@/modules/content-engine/types';
import { GlossaryTerm } from '../models/glossary-term';
import { FAQ } from '../models/faq';
import { structuredData } from '@/lib/seo/structured-data';

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
   * Generates Article schema for content engine articles.
   */
  generateArticleSchema: (article: Article) => {
    return structuredData.article({
      title: article.title,
      description: article.description,
      image: article.featuredImage || '',
      authorName: article.authorId === 'creator-1' ? 'The Market Maven' : 'Imperialpedia Expert',
      datePublished: article.publishedAt || new Date().toISOString(),
      dateModified: article.updatedAt,
    });
  },

  /**
   * Generates deep-definition schema for glossary terms.
   */
  generateGlossarySchema: (term: GlossaryTerm) => {
    return structuredData.article({
      title: `${term.term} Definition & Meaning`,
      description: term.definition,
      image: '',
      authorName: 'Imperialpedia Intelligence Index',
      datePublished: new Date().toISOString(),
    });
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
