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
import { MarketHighlights } from "@/components/home/MarketHighlights";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { HomeSectionSkeleton } from "@/components/home/HomeSectionSkeleton";
import { Leadership } from "@/components/home/Leadership";
import { ImperialpediaTalks } from "@/components/home/ImperialpediaTalks";
import { HowWeWork } from "@/components/home/HowWeWork";
import { EditorialStandards } from "@/components/home/EditorialStandards";
import { EditorialTeam } from "@/components/home/EditorialTeam";
import { SourcesMethodology } from "@/components/home/SourcesMethodology";
import { WhatWeCover } from "@/components/home/WhatWeCover";
import { HowToUse } from "@/components/home/HowToUse";
import { FeaturedKnowledge } from "@/components/home/FeaturedKnowledge";
import { AllCategories } from "@/components/home/AllCategories";

// The homepage previously inherited the root layout's generic metadata verbatim
// (no page-level `generateMetadata`) — every list/detail page in the app calls
// `buildMetadata()` except this one. This gives the homepage its own title,
// description, canonical, OG, and Twitter card instead of the layout defaults.
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Imperialpedia — Financial Intelligence Knowledge Graph",
    description:
      "Explore countries and industries alongside live market data and reviewed articles on investing, the economy, and personal finance.",
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

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <AllCategories />
      </Suspense>

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

      {/* Mid-page AdSense Unit */}
      <div className="my-8 px-4">
        <AdSenseUnit slot="8362925887" format="auto" responsive={true} />
      </div>

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <ImperialpediaTalks />
      </Suspense>

      <Suspense fallback={<HomeSectionSkeleton cards={2} />}>
        <MarketHighlights />
      </Suspense>

      {/* Bottom AdSense Unit */}
      <div className="my-8 px-4">
        <AdSenseUnit slot="8362925887" format="auto" responsive={true} />
      </div>

      <Suspense fallback={<HomeSectionSkeleton cards={6} />}>
        <TrendingTopics />
      </Suspense>

      <WhatWeCover />

      <HowToUse />

      <FeaturedKnowledge />

      {/* Trust chapter — how content gets made, what we stand for, who makes
          it, and what we cite — grouped under one tinted band (mirrors
          Leadership's own band below) so it reads as one distinct section of
          the page instead of four more white rails continuing the scroll. */}
      <div className="bg-muted/30 border-t border-border">
        <HowWeWork />
        <EditorialStandards />
        <Suspense fallback={<HomeSectionSkeleton cards={6} />}>
          <EditorialTeam />
        </Suspense>
        <SourcesMethodology />
      </div>

      <NewsletterBand />

      <Leadership />
    </div>
  );
}
