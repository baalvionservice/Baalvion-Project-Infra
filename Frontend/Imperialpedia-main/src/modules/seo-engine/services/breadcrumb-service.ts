import { Article } from '@/modules/content-engine/types';
import { Breadcrumb } from '../types';
import { env } from '@/config/env';

/**
 * @fileOverview Service for generating hierarchical breadcrumb paths and schema for all platform routes.
 */

const getAbsoluteUrl = (path: string) => {
  const baseUrl = env.siteUrl.endsWith('/') ? env.siteUrl.slice(0, -1) : env.siteUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const breadcrumbService = {
  /**
   * Home / [Category] / [Title] — links into the article's real CMS category
   * page when known (matching its canonical `/<categorySlug>/<slug>` URL),
   * falling back to the flat Intelligence bucket for uncategorized rows.
   */
  generateBreadcrumbForArticle: (article: Article): Breadcrumb => {
    const categoryPath = article.categorySlug ? `/${article.categorySlug}` : '/financial-intelligence';
    const categoryName = article.categorySlug ? article.category : 'Intelligence';
    return {
      items: [
        { name: 'Home', item: '/' },
        { name: categoryName, item: categoryPath },
        { name: article.title, item: `${categoryPath}/${article.slug}` },
      ],
    };
  },

  /**
   * Home / Authors / [Name]
   */
  generateBreadcrumbForAuthor: (authorName: string, authorSlug: string): Breadcrumb => {
    return {
      items: [
        { name: 'Home', item: '/' },
        { name: 'Authors', item: '/authors' },
        { name: authorName, item: `/authors/${authorSlug}` },
      ],
    };
  },

  /**
   * Generates JSON-LD schema for a breadcrumb.
   */
  generateBreadcrumbSchema: (breadcrumb: Breadcrumb) => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: getAbsoluteUrl(item.item),
      })),
    };
  },
};
