import React, { Suspense } from "react";
import { Metadata } from "next";
import { JsonLd } from "@/modules/seo-engine/components/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata-builder";
import { structuredData } from "@/lib/seo/structuredData";
import { LabeledAdSlot } from "@/components/common/LabeledAdSlot";

import { TermOfDay } from "@/components/landing/investopedia/TermOfDay";
import { NewsletterBand } from "@/components/landing/investopedia/NewsletterBand";
import { TERM_OF_DAY } from "@/components/landing/investopedia/content";

import { HomeIntro, homeFaqItems } from "@/components/home/HomeIntro";
import { HomeEditorial } from "@/components/home/HomeEditorial";
import { MarketHighlights } from "@/components/home/MarketHighlights";
import { HomeSectionSkeleton } from "@/components/home/HomeSectionSkeleton";
import { Leadership } from "@/components/home/Leadership";
import { ImperialpediaTalks } from "@/components/home/ImperialpediaTalks";
import { HowItWorks } from "@/components/home/HowItWorks";
import { EditorialStandards } from "@/components/home/EditorialStandards";
import { EditorialTeam } from "@/components/home/EditorialTeam";
import { SourcesMethodology } from "@/components/home/SourcesMethodology";
import { FeaturedKnowledge } from "@/components/home/FeaturedKnowledge";

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
    absoluteTitle: true,
  });
}

/**
 * Imperialpedia home — a discovery hub, not just an editorial landing page.
 * Structure: static "what is this" intro (immediate paint) → always-on topic
 * navigation (ExploreTopics — doesn't depend on the CMS having published
 * anything, so the page never collapses down to just Term of Day + newsletter)
 * → CMS-backed editorial layer (real lead story / topic rows, grouped from
 * whatever categories are actually published), so a visitor hits real content
 * before the first ad instead of just nav chrome → live discovery rails, each
 * in its own Suspense boundary so a slow data source (market feed, CMS, live
 * entity service) never blocks the rest of the page from rendering. Ad slots
 * are spaced across that content layer rather than front-loaded.
 */
export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <JsonLd data={structuredData.website()} />
      <JsonLd data={structuredData.faqPage(homeFaqItems)} />

      <HomeIntro />

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <HomeEditorial />
      </Suspense>

      {/* Top AdSense Unit — after the lead editorial content instead of before it */}
      <div className="mx-auto my-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <LabeledAdSlot slot="2039635661" />
      </div>

      <TermOfDay
        term={TERM_OF_DAY.term}
        definition={TERM_OF_DAY.definition}
        href={TERM_OF_DAY.href}
      />

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <ImperialpediaTalks />
      </Suspense>

      <Suspense fallback={<HomeSectionSkeleton cards={2} />}>
        <MarketHighlights />
      </Suspense>

      {/* Mid-page AdSense Unit */}
      <div className="mx-auto my-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <LabeledAdSlot slot="1782439199" />
      </div>

      <FeaturedKnowledge />

      {/* Bottom AdSense Unit */}
      <div className="mx-auto my-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <LabeledAdSlot slot="6058771722" />
      </div>

      {/* Trust chapter — how it works, what we stand for, who makes it, and
          what we cite — grouped under one tinted band (mirrors Leadership's
          own band below) so it reads as one distinct section of the page
          instead of more white rails continuing the scroll. */}
      <div className="bg-muted/30 border-t border-border">
        <HowItWorks />
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
