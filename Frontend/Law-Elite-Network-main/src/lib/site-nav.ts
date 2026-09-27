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

// surrounding law (see docs/editorial -- the YMYL practice-area categories,
// including personal-injury/maritime/cruise-ship, were archived the same
// pass, not just delinked, and are not coming back regardless of any
// earlier note about restoring them). These five categories started empty
// at creation and now each carry real, non-fabricated published articles
// (see category-slugs.ts's CURRENT_CATEGORY_SLUGS comment for current
// counts -- re-verify before treating any section as AdSense-ready).
// Videos and Podcasts were pulled from nav 2026-09-27 (owner request: not
// needed) -- the routes and their content still exist, just unlinked.
// Fashion was pulled from nav the same day (not part of the history/
// culture repositioning and not needed right now); the /fashion route and
// its data still exist, just unlinked -- see category-slugs.ts and
// category-visibility.ts.
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
