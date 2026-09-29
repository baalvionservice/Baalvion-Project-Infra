
import React from 'react';
import { Metadata } from 'next';
import JournalComponent from './components/JournalComponent';
import { buildAlternates } from '@/lib/seo';
import { normalizeCountry } from '@/lib/i18n/countries';

type JournalPageProps = {
  params: Promise<{
    country: string;
  }>;
};

export async function generateMetadata({ params }: JournalPageProps): Promise<Metadata> {
  const cc = normalizeCountry((await params).country);
  return {
    title: 'Maison Journal | Luxury Editorial, Insights & Heritage Stories',
    description: 'Read curated editorial content about luxury artifacts, heritage craftsmanship, and the stories behind iconic collections.',
    alternates: buildAlternates(cc, '/journal'),
    openGraph: {
      title: 'Maison Journal | Luxury Editorial & Heritage Stories',
      description: 'Curated editorial on luxury artifacts, heritage craftsmanship, and iconic collections.',
      type: 'website',
    },
  };
}

export default async function JournalPage({ params }: JournalPageProps) {

const countryCode = ((await params).country as string) || 'us';
  return (
    <JournalComponent countryCode={countryCode}  />
  );
}
