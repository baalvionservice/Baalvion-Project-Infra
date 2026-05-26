
import React from 'react';
import { Metadata } from 'next';
import JournalComponent from './components/JournalComponent';

type JournalPageProps = {
  params: {
    country: string;
  };
};

export async function generateMetadata({ params }: JournalPageProps): Promise<Metadata> {
  return {
    title: 'Maison Journal | Luxury Editorial, Insights & Heritage Stories',
    description: 'Read curated editorial content about luxury artifacts, heritage craftsmanship, and the stories behind iconic collections.',
  };
}

export default function JournalPage({ params }: JournalPageProps) {

const countryCode = (params.country as string) || 'us';
  return (
    <JournalComponent countryCode={countryCode}  />
  );
}
