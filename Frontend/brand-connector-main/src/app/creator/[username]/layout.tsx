import type { Metadata } from 'next';
import { generateMetadata as buildMetadata } from '@/lib/seo';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://connect.baalvion.com';

interface LayoutProps {
  children: React.ReactNode;
  params: { username: string };
}

// The profile page is a 'use client' component that fetches its data client-side,
// so per-creator metadata can only be templated from the URL slug here. This still
// gives each profile a unique title + canonical instead of the duplicate root title.
export function generateMetadata({ params }: LayoutProps): Metadata {
  const username = decodeURIComponent(params.username);
  const handle = username.startsWith('@') ? username : `@${username}`;
  return buildMetadata({
    title: `${handle} | Creator on Baalvion Connect`,
    description: `View ${handle}'s creator profile on Baalvion Connect — audience reach, engagement metrics, content portfolio, and verified campaign history. Collaborate with secure escrow payments.`,
    path: `/creator/${params.username}`,
  });
}

export default function CreatorProfileLayout({ children, params }: LayoutProps) {
  const username = decodeURIComponent(params.username);
  const handle = username.startsWith('@') ? username : `@${username}`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Creators',
        item: `${BASE_URL}/leaderboard`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: handle,
        item: `${BASE_URL}/creator/${params.username}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
