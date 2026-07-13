import { Article } from '@/modules/content-engine/types';
import { GlossaryTerm } from '@/modules/seo/models/glossary-term';
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
   * Home / Articles / [Category] / [Title]
   */
  generateBreadcrumbForArticle: (article: Article): Breadcrumb => {
    return {
      items: [
        { name: 'Home', item: '/' },
        { name: 'Intelligence', item: '/financial-intelligence' },
        { name: article.title, item: `/financial-intelligence/${article.slug}` },
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
