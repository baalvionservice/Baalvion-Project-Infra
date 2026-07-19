import React from 'react';
import { Metadata } from 'next';
import { buildAlternates } from '@/lib/seo';
import { normalizeCountry, getCountryConfig } from '@/lib/i18n/countries';
import { getHomepage, getPressItems, getMarketOffice } from '@/lib/cms';
import { getProducts } from '@/lib/catalog';
import { HOMEPAGE_FALLBACK, PRESS_FALLBACK, COUNTRIES } from '@/lib/mock-data';
import { localBusinessJsonLd } from '@/lib/structured-data';
import { HomeHero } from '@/components/home/HomeHero';
import { ServiceCards } from '@/components/home/ServiceCards';
import { FeaturedCollections } from '@/components/home/FeaturedCollections';
import { NewArrivalsGrid } from '@/components/home/NewArrivalsGrid';
import { AuthenticityTrust } from '@/components/home/AuthenticityTrust';
import { Testimonials } from '@/components/home/Testimonials';
import { PressStrip } from '@/components/home/PressStrip';

// Fetch CMS + catalog live per request so admin edits appear immediately.
export const dynamic = 'force-dynamic';

type CountryHomeProps = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: CountryHomeProps): Promise<Metadata> {
  const cc = normalizeCountry((await params).country);
  const countryData = getCountryConfig(cc);
  const office = await getMarketOffice(cc, COUNTRIES[cc]?.office ?? COUNTRIES.us.office);
  // Genuinely distinct per market (city + currency), not the same paragraph with the
  // country name swapped in — that reads as thin/duplicate content to search engines
  // running 5 near-identical pages.
  const description = `Rare and pre-owned Hermès, Chanel and fine jewelry, authenticated in-house and priced in ${countryData.currency}. Private showroom in ${office.city}, white-glove delivery across ${countryData.name} — curating the world's most exquisite treasures since 1924.`;
  return {
    title: `AMARISÉ MAISON AVENUE | Authenticated Luxury in ${countryData.name}`,
    description,
    alternates: buildAlternates(cc, ''),
    openGraph: {
      title: `AMARISÉ MAISON AVENUE | Authenticated Luxury in ${countryData.name}`,
      description,
      type: 'website',
    },
  };
}

export default async function CountryPage({ params }: CountryHomeProps) {
  const countryCode = normalizeCountry((await params).country);

  // Centrally-managed landing page from the CMS; bundled fallback if CMS is down.
  const homepage = (await getHomepage()) ?? HOMEPAGE_FALLBACK;
  const press = (await getPressItems()) ?? PRESS_FALLBACK;

  // Live "new arrivals" from commerce-service, scoped to the active market.
  const na = homepage.newArrivals;
  const productsPage = await getProducts({
    country: countryCode,
    limit: na.limit,
    categoryId: na.categoryId,
    collectionId: na.collectionId,
  });

  const country = COUNTRIES[countryCode] ?? COUNTRIES.us;
  const office = await getMarketOffice(countryCode, country.office);
  const storeSchema = localBusinessJsonLd(countryCode, { ...country, office });

  return (
    <div className="animate-fade-in bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <HomeHero hero={homepage.hero} countryCode={countryCode} />
      <ServiceCards services={homepage.services} countryCode={countryCode} />
      <FeaturedCollections
        collections={homepage.featuredCollections}
        countryCode={countryCode}
      />
      <NewArrivalsGrid
        config={homepage.newArrivals}
        products={productsPage.items}
        countryCode={countryCode}
      />
      <AuthenticityTrust trust={homepage.trust} />
      <Testimonials testimonials={homepage.testimonials} />
      <PressStrip
        title={homepage.pressTitle}
        subtitle={homepage.pressSubtitle}
        logos={press.logos}
      />
    </div>
  );
}
