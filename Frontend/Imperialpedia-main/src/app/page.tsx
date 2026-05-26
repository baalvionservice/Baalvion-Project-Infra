
import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";

import { JsonLd } from "@/modules/seo-engine/components/JsonLd";


import { MainNewsSection } from "@/components/common/MainNewsSection";
import LatestArticles from "@/components/common/LatestArticles";
import { ImperialpediaForAdvisors } from "@/components/common/Advisors";
import { OurMission } from "@/components/common/OurMission";
import StocksSection from "@/components/common/StocksSection";




/**
 * The main Home page for Imperialpedia.
 * Optimized for institutional-grade performance with dynamic imports and high-priority LCP handling.
 */
export default function Home() {

  return (
    <div className="flex flex-col w-full">
      <div className="flex max-w-7xl mx-auto flex-col w-full">
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

        {/* Above the fold - Priority Loading */}
        <HeroSection />
        <StocksSection />
        <MainNewsSection />
        <LatestArticles />



      </div>
      <ImperialpediaForAdvisors />
      <div className="flex max-w-7xl mx-auto flex-col w-full">
        <OurMission />
      </div>
    </div>
  );
}
