/**
 * The one definition of LEN's primary navigation. The desktop bar, its
 * dropdowns and the mobile drawer all render from this, so growing the site
 * means adding an entry here rather than editing three components. A section
 * with no `children` is a plain link; with `children` it gets a dropdown
 * (desktop) / an accordion (mobile), and its own `href` stays the "see all" link.
 */
export interface NavLink {
  label: string;
  href: string;
}

export interface NavSection extends NavLink {
  children?: NavLink[];
}

// 2026-09-27 repositioning: LEN moved from a legal-news/lead-gen identity to
// a publication about the history, culture, language and technology
// surrounding law (see docs/editorial -- the YMYL practice-area categories,
// including personal-injury/maritime/cruise-ship, were archived the same
// pass, not just delinked, and are not coming back regardless of any
// earlier note about restoring them). These five categories are newly
// created in the CMS -- see category-slugs.ts's CURRENT_CATEGORY_SLUGS
// comment for current article counts before treating them as launch-ready.
// Fashion and Videos/Podcasts are dropped from this nav (later commits the
// same day remove them from the sitemap/footer too) -- unlinked, not
// deleted.
export const PRIMARY_NAV: NavSection[] = [
  {
    label: 'Stories on Screen',
    href: '/law-and-popular-culture',
  },
  {
    label: 'History & Heritage',
    href: '/history-and-civilization',
  },
  {
    label: 'Language & Ideas',
    href: '/language-and-literature',
  },
  {
    label: 'Technology & Innovation',
    href: '/technology-and-digital-culture',
  },
  {
    label: 'Culture & Society',
    href: '/law-culture-and-society',
  },
  {
    label: 'Law School Life',
    href: '/law-school-success',
  },
];
