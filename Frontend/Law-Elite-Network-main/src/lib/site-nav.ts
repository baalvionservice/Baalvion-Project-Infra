import { PERSON_CATEGORIES } from '@/types/person';

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

const PEOPLE_SHOWN_IN_MENU = ['actors', 'musicians', 'athletes', 'creators', 'lawyers', 'judges'];

export const PRIMARY_NAV: NavSection[] = [
  {
    label: 'News',
    href: '/#latest',
    children: [
      { label: 'Latest', href: '/#latest' },
      { label: 'Trending', href: '/#trending' },
      { label: 'Celebrity News', href: '/celebrity-news' },
    ],
  },
  {
    label: 'People',
    href: '/people',
    children: PERSON_CATEGORIES.filter((c) => PEOPLE_SHOWN_IN_MENU.includes(c.slug)).map((c) => ({
      label: c.plural,
      href: `/people/${c.slug}`,
    })),
  },
  {
    label: 'Entertainment',
    href: '/entertainment',
    children: [
      { label: 'Movies', href: '/movies' },
      { label: 'Streaming', href: '/streaming' },
      { label: 'Music', href: '/music' },
      { label: 'Celebrity News', href: '/celebrity-news' },
    ],
  },
  {
    label: 'Sports',
    href: '/sports',
    children: [
      { label: 'Teams', href: '/sports/teams' },
      { label: 'Competitions', href: '/sports/competitions' },
      { label: 'Athletes', href: '/people/athletes' },
    ],
  },
  {
    label: 'Fashion',
    href: '/fashion',
  },
  {
    label: 'Legal',
    href: '/legal/cases',
    children: [
      { label: 'Cases', href: '/legal/cases' },
      { label: 'Courts', href: '/legal/courts' },
      { label: 'Lawyers', href: '/people/lawyers' },
      { label: 'Judges', href: '/people/judges' },
      { label: 'Personal Injury', href: '/personal-injury-lawyer' },
      { label: 'Maritime Injury', href: '/maritime-offshore-injury-law' },
      { label: 'Cruise Ship Accidents', href: '/cruise-ship-passenger-vessel-accidents' },
      { label: 'Law School Success', href: '/law-school-success' },
    ],
  },
  { label: 'Topics', href: '/topics' },
  {
    label: 'Videos',
    href: '/videos',
    children: [
      { label: 'Podcasts', href: '/podcasts' },
    ],
  },
];
