import React from "react";
import { JsonLd } from "@/modules/seo-engine/components/JsonLd";

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

/**
 * Imperialpedia home — content-led editorial layout in the style of a modern
 * financial-reference publication: trending bar, lead story, topic rows,
 * term of the day, and a newsletter conversion band.
 */
export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Imperialpedia",
          url: "https://imperialpedia.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://imperialpedia.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />

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

      <NewsletterBand />
    </div>
  );
}
