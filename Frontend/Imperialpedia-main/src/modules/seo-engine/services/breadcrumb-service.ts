import { Article } from '@/modules/content-engine/types';
import { GlossaryTerm } from '@/modules/seo/models/glossary-term';
import { Category } from '@/modules/content-engine/types/category';
import { Tag } from '@/modules/content-engine/types/tag';
import { Breadcrumb, BreadcrumbItem } from '../types';
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
   * Home / Articles / [Category] / [Title]
   */
  generateBreadcrumbForArticle: (article: Article): Breadcrumb => {
    return {
      items: [
        { name: 'Home', item: '/' },
        { name: 'Intelligence', item: '/articles' },
        { name: article.category, item: `/categories/${article.category.toLowerCase()}` },
        { name: article.title, item: `/articles/${article.slug}` },
      ],
    };
  },

  /**
   * Home / Glossary / [Letter] / [Term]
   */
  generateBreadcrumbForGlossary: (term: GlossaryTerm): Breadcrumb => {
    const letter = term.term.charAt(0).toLowerCase();
    return {
      items: [
        { name: 'Home', item: '/' },
        { name: 'Glossary', item: '/glossary' },
        { name: letter.toUpperCase(), item: `/glossary/${letter}` },
        { name: term.term, item: `/glossary/${term.slug}` },
      ],
    };
  },

  /**
   * Home / Categories / [Name]
   */
  generateBreadcrumbForCategory: (category: Category): Breadcrumb => {
    return {
      items: [
        { name: 'Home', item: '/' },
        { name: 'Categories', item: '/articles' },
        { name: category.name, item: `/categories/${category.slug}` },
      ],
    };
  },

  /**
   * Home / Topics / [Name]
   */
  generateBreadcrumbForTag: (tag: Tag): Breadcrumb => {
    return {
      items: [
        { name: 'Home', item: '/' },
        { name: 'Topics', item: '/topics' },
        { name: tag.name, item: `/tags/${tag.slug}` },
      ],
    };
  },

  /**
   * Home / Glossary / [Letter]
   */
  generateBreadcrumbForGlossaryLetter: (letter: string): Breadcrumb => {
    return {
      items: [
        { name: 'Home', item: '/' },
        { name: 'Glossary', item: '/glossary' },
        { name: `Letter ${letter.toUpperCase()}`, item: `/glossary/${letter.toLowerCase()}` },
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
