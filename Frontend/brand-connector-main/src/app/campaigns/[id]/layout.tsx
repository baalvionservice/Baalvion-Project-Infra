import type { Metadata } from 'next';
import { generateMetadata as buildMetadata } from '@/lib/seo';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://connect.baalvion.com';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

// Campaign detail is a 'use client' page that fetches its data client-side, so the
// per-campaign title/description can only be templated here. This still removes the
// duplicate root title and gives each campaign a unique canonical URL.
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  return buildMetadata({
    title: 'Brand Campaign | Baalvion Connect',
    description:
      'Explore this brand campaign on Baalvion Connect — deliverables, budget, requirements, and timeline. Apply and collaborate with secure escrow payments.',
    path: `/campaigns/${id}`,
  });
}

export default async function CampaignDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Campaigns',
        item: `${BASE_URL}/campaigns`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Campaign',
        item: `${BASE_URL}/campaigns/${id}`,
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
