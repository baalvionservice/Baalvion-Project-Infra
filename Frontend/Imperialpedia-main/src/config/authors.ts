/**
 * @fileOverview Editorial author registry.
 * Imperialpedia's CMS does not yet attribute individual articles to an author record
 * (see cms-public.ts — content rows carry no reliable author link today), so this is a
 * small static roster rather than a CMS-backed list. Every published article on the site
 * is written, reviewed, or fact-checked by this roster; /authors/[slug] currently shows
 * the full library.
 *
 * Three-role editorial byline (E-E-A-T): every article names a writer (`authorSlug`),
 * an editorial reviewer (`reviewerSlug`), and a fact-checker (`factCheckerSlug`) — see
 * `Article` in modules/content-engine/types/article.ts and `AuthorCredibilityCard`.
 * `role` below documents each person's usual position in that rotation; it's metadata
 * for editors assigning content, not an enforced constraint — any author can be named
 * in any of the three CMS fields on a given article.
 */

export type AuthorRole = 'writer' | 'reviewer' | 'fact-checker';

export interface AuthorSocialLinks {
  twitter?: string;
  linkedin?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
}

export interface AuthorProfile {
  slug: string;
  name: string;
  title: string;
  bio: string;
  credentials?: string;
  role: AuthorRole;
  avatarUrl?: string;
  social?: AuthorSocialLinks;
}

export const authors: AuthorProfile[] = [
  {
    slug: 'nathan-reiff',
    name: 'Nathan Reiff',
    title: 'Financial Writer & Economics Researcher',
    role: 'writer',
    bio: 'Nathan Reiff is a financial writer and economic researcher with over a decade of experience covering macroeconomic policy, personal finance, investing strategies, and deposit banking.',
    social: {
      twitter: 'https://twitter.com/imperialpedia',
      linkedin: 'https://linkedin.com/company/imperialpedia',
    },
  },
  {
    slug: 'julius-mansa',
    name: 'Julius Mansa',
    title: 'Financial Reviewer & CFO Consultant',
    role: 'reviewer',
    credentials: 'CFO Consultant & Financial Analysis Specialist',
    bio: 'Julius Mansa is an experienced financial consultant and educator specializing in corporate finance, financial accounting, personal budgeting, and investment analysis.',
  },
  {
    slug: 'yarilet-perez',
    name: 'Yarilet Perez',
    title: 'Fact-Checking Editor',
    role: 'fact-checker',
    credentials: 'Fact-Checking & Economic Research Standards',
    bio: 'Yarilet Perez is an editorial fact-checker with extensive experience in verifying economic indicators, banking disclosures, and investment data against primary regulatory sources.',
  },
  {
    slug: 'allen-krewzz',
    name: 'Allen Krewzz',
    title: 'Financial Writer & Analyst',
    role: 'writer',
    bio: 'Allen Krewzz is a Financial Writer & Analyst at Imperialpedia, covering personal finance, markets, and the financial products people rely on every day. His writing focuses on breaking down loans, credit, investing, and banking topics into clear, actionable guidance grounded in how these decisions actually play out for everyday readers.',
    social: {
      twitter: 'https://x.com/allenkrewzzz',
      linkedin: 'https://www.linkedin.com/in/allenkrewzz/',
    },
  },
  {
    slug: 'tamanna-shaikh',
    name: 'Tamanna Shaikh',
    title: 'Senior Editor',
    role: 'reviewer',
    credentials: 'Editorial Standards & Accuracy',
    bio: "Tamanna Shaikh is Imperialpedia's Senior Editor, responsible for editorial review across investing, banking, and personal-finance coverage. She checks every reviewed article against its underlying sources and house style before publication, focusing on whether the guidance holds up against how markets and financial products actually behave.",
  },
  {
    slug: 'deepak-kuldeep',
    name: 'Deepak Kuldeep',
    title: 'Fact-Checking Editor',
    role: 'fact-checker',
    credentials: 'Editorial Accuracy & Sourcing',
    bio: "Deepak Kuldeep is Imperialpedia's Fact-Checking Editor. He verifies data points, statistics, and cited sources in published articles — rates, figures, and claims are checked against primary sources rather than taken at face value, and anything that can't be verified is corrected or removed before an article is marked fact-checked.",
  },
];

export function getAuthorBySlug(slug: string): AuthorProfile | undefined {
  return authors.find((author) => author.slug === slug);
}

export function getAllAuthors(): AuthorProfile[] {
  return authors;
}
