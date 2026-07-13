/**
 * @fileOverview Editorial author registry.
 * Imperialpedia's CMS does not yet attribute individual articles to an author record
 * (see cms-public.ts — content rows carry no reliable author link today), so this is a
 * small static roster rather than a CMS-backed list. Every published article on the site
 * is written by this roster's authors; /authors/[slug] currently shows the full library.
 */

export interface AuthorSocialLinks {
  twitter?: string;
  linkedin?: string;
  website?: string;
}

export interface AuthorProfile {
  slug: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
  social?: AuthorSocialLinks;
}

export const authors: AuthorProfile[] = [
  {
    slug: 'allen-krewzz',
    name: 'Allen Krewzz',
    title: 'Financial Writer & Analyst',
    bio: 'Allen Krewzz is a Financial Writer & Analyst at Imperialpedia, covering personal finance, markets, and the financial products people rely on every day. His writing focuses on breaking down loans, credit, investing, and banking topics into clear, actionable guidance grounded in how these decisions actually play out for everyday readers.',
    social: {
      twitter: 'https://x.com/allenkrewzzz',
      linkedin: 'https://www.linkedin.com/in/allenkrewzz/',
    },
  },
];

export function getAuthorBySlug(slug: string): AuthorProfile | undefined {
  return authors.find((author) => author.slug === slug);
}

export function getAllAuthors(): AuthorProfile[] {
  return authors;
}
