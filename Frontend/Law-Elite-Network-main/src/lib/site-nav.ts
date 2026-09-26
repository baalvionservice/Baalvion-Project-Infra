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

// Third AdSense-readiness retirement pass, 2026-09-25 (see
// category-slugs.ts's CURRENT_CATEGORY_SLUGS comment): People, Entertainment,
// Sports, and Topics sections removed -- every link they held now 301s to /
// (next.config.ts). The Legal section is back to its original 3-category
// form (personal injury, maritime injury, cruise ship accidents) plus Law
// School Success -- no Cases/Courts/Lawyers/Judges children, since that
// directory is still retired. News un-retired at explicit request (see
// next.config.ts). Videos/Podcasts nav section removed in a follow-up pass
// (2026-09-27, after the third rejection): the content behind it was real
// but entirely off-topic for a legal-guides site (general entertainment
// clips/podcasts), so the whole Media pillar is retired, not just relabeled
// -- see next.config.ts redirects and sitemap.ts. Fashion dropped in the same
// pass -- it never got real content and is still a placeholder page (see
// category-slugs.ts). Restore the removed sections alongside
// CURRENT_CATEGORY_SLUGS once AdSense approves the site as it stands.
export const PRIMARY_NAV: NavSection[] = [
  {
    label: 'News',
    href: '/news',
  },
  {
    label: 'Legal',
    href: '/personal-injury-lawyer',
    children: [
      { label: 'Personal Injury', href: '/personal-injury-lawyer' },
      { label: 'Maritime Injury', href: '/maritime-offshore-injury-law' },
      { label: 'Cruise Ship Accidents', href: '/cruise-ship-passenger-vessel-accidents' },
      { label: 'Law School Success', href: '/law-school-success' },
    ],
  },
];
