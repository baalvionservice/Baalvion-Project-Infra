export interface NavItem {
  title: string;
  href: string;
  /** One-line summary used in search results, cards, and sidebars. */
  description: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface DocsSection {
  slug: string;
  /** Label shown in the top bar section switcher. */
  label: string;
  groups: NavGroup[];
}

export const DOCS_SECTIONS: DocsSection[] = [
  {
    slug: 'getting-started',
    label: 'Getting Started',
    groups: [
      {
        title: 'Getting Started',
        items: [
          {
            title: 'What Is Baalvion',
            href: '/getting-started/what-is-baalvion',
            description: 'An overview of the Baalvion trade platform and how its properties fit together.',
          },
          {
            title: 'How the Platform Works',
            href: '/getting-started/how-it-works',
            description: 'The trade lifecycle, roles, and how buyers, sellers, and agents interact.',
          },
          {
            title: 'Creating an Account',
            href: '/getting-started/creating-an-account',
            description: 'How to sign up and get access to the trade platform.',
          },
          {
            title: 'Logging In & Role-Based Routing',
            href: '/getting-started/logging-in',
            description: 'How login works and how you land on the right dashboard for your role.',
          },
          {
            title: 'Resetting Your Password',
            href: '/getting-started/password-reset',
            description: 'Step-by-step password recovery instructions.',
          },
          {
            title: 'First-Time Onboarding',
            href: '/getting-started/onboarding',
            description: 'What to expect the first time you sign in, by role.',
          },
          {
            title: 'System Requirements',
            href: '/getting-started/system-requirements',
            description: 'Supported browsers, devices, and network requirements.',
          },
        ],
      },
    ],
  },
  {
    slug: 'guides',
    label: 'User Guides',
    groups: [
      {
        title: 'Role Guides',
        items: [
          {
            title: 'Buyer Guide',
            href: '/guides/buyer',
            description: 'Dashboard walkthrough, daily workflows, and best practices for buyers.',
          },
          {
            title: 'Seller Guide',
            href: '/guides/seller',
            description: 'Managing listings, orders, and trades as a seller.',
          },
          {
            title: 'Trade Agent Guide',
            href: '/guides/agent',
            description: 'Task management, approvals, and coordination for trade agents.',
          },
        ],
      },
    ],
  },
  {
    slug: 'platform',
    label: 'Platform Documentation',
    groups: [
      {
        title: 'Core Concepts',
        items: [
          {
            title: 'Dashboard System',
            href: '/platform/dashboard-system',
            description: 'How role-based dashboards are structured across the platform.',
          },
          {
            title: 'Role-Based Navigation',
            href: '/platform/role-based-navigation',
            description: 'How your role determines what you see and where you can go.',
          },
          {
            title: 'Permissions',
            href: '/platform/permissions',
            description: 'How access control works for buyers, sellers, and agents.',
          },
          {
            title: 'Notifications',
            href: '/platform/notifications',
            description: 'In-app, email, and system notifications and how to manage them.',
          },
          {
            title: 'Messaging',
            href: '/platform/messaging',
            description: 'Communicating with counterparties and agents inside a trade.',
          },
          {
            title: 'Reporting',
            href: '/platform/reporting',
            description: 'Trade, order, and activity reports available on the platform.',
          },
          {
            title: 'Search',
            href: '/platform/search',
            description: 'How search works across trades, listings, and documents.',
          },
          {
            title: 'Settings & Profile Management',
            href: '/platform/settings-profile',
            description: 'Managing your profile, organization details, and preferences.',
          },
          {
            title: 'Security Model',
            href: '/platform/security-model',
            description: 'Authentication, sessions, and how the platform protects your account.',
          },
        ],
      },
    ],
  },
  {
    slug: 'api',
    label: 'API Documentation',
    groups: [
      {
        title: 'Overview',
        items: [
          {
            title: 'API Overview',
            href: '/api/overview',
            description: 'What the Baalvion API is for and how it is organized.',
          },
          {
            title: 'Authentication',
            href: '/api/authentication',
            description: 'API keys, token-based auth, and how to authenticate requests.',
          },
        ],
      },
      {
        title: 'Core APIs',
        items: [
          { title: 'Users API', href: '/api/users', description: 'Manage user and organization records.' },
          { title: 'Orders & Trades API', href: '/api/orders', description: 'Create and manage trades and orders.' },
          { title: 'Listings API', href: '/api/listings', description: 'Manage product and listing data.' },
          { title: 'Tasks API', href: '/api/tasks', description: 'Agent task assignment and status.' },
          {
            title: 'Notifications API',
            href: '/api/notifications',
            description: 'Read and manage notification records.',
          },
          { title: 'Reports API', href: '/api/reports', description: 'Retrieve trade and account reports.' },
        ],
      },
      {
        title: 'Integration',
        items: [
          { title: 'Webhooks', href: '/api/webhooks', description: 'Subscribe to platform events in real time.' },
          { title: 'Rate Limits', href: '/api/rate-limits', description: 'Request limits and best practices.' },
          { title: 'Error Handling', href: '/api/errors', description: 'Standard error codes and debugging.' },
          {
            title: 'Code Examples',
            href: '/api/code-examples',
            description: 'JavaScript, Python, and cURL examples.',
          },
        ],
      },
    ],
  },
  {
    slug: 'faqs',
    label: 'FAQs',
    groups: [{ title: 'FAQs', items: [{ title: 'Frequently Asked Questions', href: '/faqs', description: 'Answers to the most common questions.' }] }],
  },
  {
    slug: 'troubleshooting',
    label: 'Troubleshooting',
    groups: [
      {
        title: 'Troubleshooting',
        items: [{ title: 'Troubleshooting Guide', href: '/troubleshooting', description: 'Step-by-step fixes for common problems.' }],
      },
    ],
  },
  {
    slug: 'release-notes',
    label: 'Release Notes',
    groups: [
      {
        title: 'Release Notes',
        items: [{ title: 'Release Notes', href: '/release-notes', description: 'What shipped, and when.' }],
      },
    ],
  },
  {
    slug: 'support',
    label: 'Support',
    groups: [
      { title: 'Support', items: [{ title: 'Contact Support', href: '/support', description: 'Get help from the Baalvion team.' }] },
    ],
  },
];

/** Flattened, ordered list of every doc page — used for search and prev/next links. */
export const ALL_ITEMS: NavItem[] = DOCS_SECTIONS.flatMap((section) => section.groups.flatMap((group) => group.items));

export function findSection(pathname: string): DocsSection | undefined {
  const slug = pathname.split('/').filter(Boolean)[0];
  return DOCS_SECTIONS.find((section) => section.slug === slug);
}

export function findAdjacent(pathname: string): { prev?: NavItem; next?: NavItem } {
  const index = ALL_ITEMS.findIndex((item) => item.href === pathname);
  if (index === -1) return {};
  return { prev: ALL_ITEMS[index - 1], next: ALL_ITEMS[index + 1] };
}
