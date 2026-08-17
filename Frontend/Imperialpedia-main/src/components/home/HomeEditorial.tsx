import React from "react";
import { LeadStory } from "@/components/landing/investopedia/LeadStory";
import { TopicSection } from "@/components/landing/investopedia/TopicSection";
import { LatestArticles } from "./LatestArticles";
import { PersonalFinanceSpotlight } from "./PersonalFinanceSpotlight";
import { PopularReads } from "./PopularReads";
import { getHomeEditorial } from "./getHomeEditorial";

/**
 * Real, CMS-backed replacement for the homepage's above-the-fold editorial
 * block (lead story + topic rows) — see `getHomeEditorial.ts` for why this
 * replaced the old hardcoded mock content. Renders nothing if the CMS has no
 * published articles yet, same "honest empty" convention `LatestArticles`
 * already follows, rather than falling back to fake content.
 */
export async function HomeEditorial() {
  const editorial = await getHomeEditorial();
  if (!editorial) return null;

  return (
    <>
      <LeadStory
        lead={editorial.lead}
        leadRelated={editorial.leadRelated}
        secondaryLead={editorial.secondaryLead}
        secondaryLeadRelated={editorial.secondaryLeadRelated}
        otherTopStories={editorial.otherTopStories}
      />
      {editorial.topicGroups.map((group) => (
        <TopicSection key={group.title} group={group} />
      ))}
      <LatestArticles articles={editorial.latestArticles} />
      <PersonalFinanceSpotlight spotlight={editorial.personalFinance} />
      <PopularReads articles={editorial.popularReads} />
    </>
  );
}

export default HomeEditorial;
