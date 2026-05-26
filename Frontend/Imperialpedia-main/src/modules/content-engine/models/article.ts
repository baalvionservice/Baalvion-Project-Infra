import { Article, ArticleStatus } from '../types/article';

/**
 * @fileOverview Helper constants and default values for Article models.
 */

export const ARTICLE_STATUSES: ArticleStatus[] = ['draft', 'review', 'published', 'archived'];

export const createEmptyArticle = (authorId: string): Partial<Article> => ({
  title: '',
  description: '',
  authorId,
  status: 'draft',
  category: 'General',
  tags: [],
  readingTime: 0,
  updatedAt: new Date().toISOString(),
});
