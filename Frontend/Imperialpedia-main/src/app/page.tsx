import React, { Suspense } from "react";
import { Metadata } from "next";
import { JsonLd } from "@/modules/seo-engine/components/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata-builder";
import { structuredData } from "@/lib/seo/structuredData";
import { AdSenseUnit } from "@/components/common/AdSense";

import { TrendingBar } from "@/components/landing/investopedia/TrendingBar";
import { TermOfDay } from "@/components/landing/investopedia/TermOfDay";
import { NewsletterBand } from "@/components/landing/investopedia/NewsletterBand";
import { TERM_OF_DAY } from "@/components/landing/investopedia/content";

import { HomeIntro, homeFaqItems } from "@/components/home/HomeIntro";
import { HomeEditorial } from "@/components/home/HomeEditorial";
import { ExploreTopics } from "@/components/home/ExploreTopics";
import { LatestArticles } from "@/components/home/LatestArticles";
import { MarketHighlights } from "@/components/home/MarketHighlights";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { KnowledgeCategories } from "@/components/home/KnowledgeCategories";
import { FeaturedCompanies } from "@/components/home/FeaturedCompanies";
import { RecentlyUpdated } from "@/components/home/RecentlyUpdated";
import { HomeSectionSkeleton } from "@/components/home/HomeSectionSkeleton";
import { Leadership } from "@/components/home/Leadership";

// The homepage previously inherited the root layout's generic metadata verbatim
// (no page-level `generateMetadata`) — every list/detail page in the app calls
// `buildMetadata()` except this one. This gives the homepage its own title,
// description, canonical, OG, and Twitter card instead of the layout defaults.
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Imperialpedia — Financial Intelligence Knowledge Graph",
    description:
      "Explore companies, countries, industries, and technologies alongside live market data and reviewed articles on investing, the economy, and personal finance.",
    canonical: "/",
    ogType: "website",
  });
}

/**
 * Imperialpedia home — a discovery hub, not just an editorial landing page.
 * Structure: static "what is this" intro (immediate paint) → always-on topic
 * navigation (ExploreTopics — doesn't depend on the CMS having published
 * anything, so the page never collapses down to just Term of Day + newsletter)
 * → CMS-backed editorial layer (real lead story / topic rows, grouped from
 * whatever categories are actually published) → live discovery rails, each in
 * its own Suspense boundary so a slow data source (market feed, CMS, live
 * entity service) never blocks the rest of the page from rendering.
 */
export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <JsonLd data={structuredData.website()} />
      <JsonLd data={structuredData.faqPage(homeFaqItems)} />

      <HomeIntro />

      <TrendingBar />

      <ExploreTopics />

      {/* Top AdSense Unit - Display ad above main content */}
      <div className="my-8 px-4">
        <AdSenseUnit slot="8362925887" format="auto" responsive={true} />
      </div>

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <HomeEditorial />
      </Suspense>

      <TermOfDay
        term={TERM_OF_DAY.term}
        definition={TERM_OF_DAY.definition}
        href={TERM_OF_DAY.href}
      />

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <LatestArticles />
      </Suspense>

      {/* Mid-page AdSense Unit */}
      <div className="my-8 px-4">
        <AdSenseUnit slot="8362925887" format="auto" responsive={true} />
      </div>

      <Suspense fallback={<HomeSectionSkeleton cards={2} />}>
        <MarketHighlights />
      </Suspense>

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <KnowledgeCategories />
      </Suspense>

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <FeaturedCompanies />
      </Suspense>

      <Suspense fallback={<HomeSectionSkeleton cards={6} />}>
        <RecentlyUpdated />
      </Suspense>

      {/* Bottom AdSense Unit */}
      <div className="my-8 px-4">
        <AdSenseUnit slot="8362925887" format="auto" responsive={true} />
      </div>

      <Suspense fallback={<HomeSectionSkeleton cards={6} />}>
        <TrendingTopics />
      </Suspense>

      <NewsletterBand />

      <Leadership />
    </div>
  );
}
