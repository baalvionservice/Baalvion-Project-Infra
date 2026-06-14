import React from 'react';
import { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';
import { normalizeCountry, getCountryConfig } from '@/lib/i18n/countries';

type CountryHomeProps = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: CountryHomeProps): Promise<Metadata> {
  const cc = normalizeCountry((await params).country);
  const countryData = getCountryConfig(cc);
  return {
    title: `AMARISÉ MAISON AVENUE | Ultra-Luxury Maison in ${countryData.name}`,
    description: `Explore Amarisé Maison Avenue in ${countryData.name} — exclusive haute couture, high-end watches, and fine jewelry curated since 1924.`,
    alternates: buildAlternates(cc, ''),
    openGraph: {
      title: `AMARISÉ MAISON AVENUE | The Pinnacle of Global Luxury`,
      description: `Exclusive haute couture, high-end watches, and fine jewelry — curated since 1924.`,
      type: 'website',
    },
  };
}

export default function CountryPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        Country Page Working
      </h1>
    </main>
  );
}