import React from 'react';
import { Metadata } from 'next';
import BuyingGuideListing from './BuyingGuideListing';

type BuyingGuidePageProps = {
  params: Promise<{
    country: string;
  }>;
};

export async function generateMetadata({ params }: BuyingGuidePageProps): Promise<Metadata> {
  return {
    title: 'Buying Guides | AMARISÉ MAISON - Expert Curation & Intelligence',
    description: 'Explore our curated collection of buying guides featuring expert advice on luxury acquisitions, material mastery, and heritage craftsmanship.',
  };
}

/**
 * BuyingGuideListingPage: server entry that preserves route metadata and
 * delegates rendering to the client listing (store-backed).
 */
export default async function BuyingGuideListingPage({ params }: BuyingGuidePageProps) {
  const countryCode = ((await params).country as string) || 'us';
  return <BuyingGuideListing countryCode={countryCode} />;
}
