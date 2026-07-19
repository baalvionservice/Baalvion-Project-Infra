import React, { Suspense } from "react";
import { Metadata } from "next";
import { JsonLd } from "@/modules/seo-engine/components/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata-builder";
import { structuredData } from "@/lib/seo/structuredData";

import { TrendingBar } from "@/components/landing/investopedia/TrendingBar";
import { LeadStory } from "@/components/landing/investopedia/LeadStory";
import { TopicSection } from "@/components/landing/investopedia/TopicSection";
import { TermOfDay } from "@/components/landing/investopedia/TermOfDay";
import { NewsletterBand } from "@/components/landing/investopedia/NewsletterBand";
import {
  LEAD_STORY,
  TOP_STORIES,
  TOPIC_GROUPS,
  TERM_OF_DAY,
} from "@/components/landing/investopedia/content";

import { HomeIntro, homeFaqItems } from "@/components/home/HomeIntro";
import { LatestArticles } from "@/components/home/LatestArticles";
import { MarketHighlights } from "@/components/home/MarketHighlights";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { KnowledgeCategories } from "@/components/home/KnowledgeCategories";
import { FeaturedCompanies } from "@/components/home/FeaturedCompanies";
import { RecentlyUpdated } from "@/components/home/RecentlyUpdated";
import { HomeSectionSkeleton } from "@/components/home/HomeSectionSkeleton";

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
 * Structure: static "what is this" intro (immediate paint) → editorial layer
 * (curated lead story / topic rows, unchanged) → live discovery rails, each
 * in its own Suspense boundary so a slow data source (market feed, CMS,
 * live entity service) never blocks the rest of the page from rendering.
 */
export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <JsonLd data={structuredData.website()} />
      <JsonLd data={structuredData.faqPage(homeFaqItems)} />

      <HomeIntro />

      <TrendingBar />
      <LeadStory lead={LEAD_STORY} secondary={TOP_STORIES} />

      <TopicSection group={TOPIC_GROUPS[0]} />
      <TopicSection group={TOPIC_GROUPS[1]} />

      <TermOfDay
        term={TERM_OF_DAY.term}
        definition={TERM_OF_DAY.definition}
        href={TERM_OF_DAY.href}
      />

      <TopicSection group={TOPIC_GROUPS[2]} />
      <TopicSection group={TOPIC_GROUPS[3]} />

      <Suspense fallback={<HomeSectionSkeleton cards={4} />}>
        <LatestArticles />
      </Suspense>

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

      <Suspense fallback={<HomeSectionSkeleton cards={6} />}>
        <TrendingTopics />
      </Suspense>

      <NewsletterBand />
    </div>
  );
}
