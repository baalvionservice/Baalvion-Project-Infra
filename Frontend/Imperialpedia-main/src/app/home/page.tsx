import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/design-system/layout/container';
import { HeroSearch } from '@/components/home/HeroSearch';
import { MarketOverview } from '@/components/home/MarketOverview';
import { NewsGrid } from '@/components/home/NewsGrid';
import { LearningHub } from '@/components/home/LearningHub';
import { GlossarySpotlight } from '@/components/home/GlossarySpotlight';
import { TrendingTopics } from '@/components/home/TrendingTopics';
import { FeaturedGrid } from '@/components/home/FeaturedGrid';
import { AISection } from '@/components/home/AISection';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Financial Intelligence Hub | Market News & Education',
  description: 'Real-time market insights, expert financial analysis, and comprehensive educational nodes. Audit the global economy with Imperialpedia.',
});

/**
 * Primary Institutional Homepage.
 * Orchestrates high-fidelity financial content delivery and discovery.
 * Balanced for SEO authority and AdSense readiness.
 */
export default function PrimaryHomePage() {
  return (
    <main className="min-h-screen bg-background animate-in fade-in duration-1000">
      {/* 1. HERO SECTION (Above the fold) */}
      <HeroSearch />

      <Container className="space-y-24 py-20">
        {/* 2. BREAKING NEWS (Live zone) */}
        <NewsGrid />

        {/* 3. FEATURED LEARNING HUB */}
        <LearningHub />

        {/* 4. GLOSSARY SPOTLIGHT */}
        <GlossarySpotlight />

        {/* 5. MARKET OVERVIEW */}
        <MarketOverview />

        {/* 6. TRENDING TOPICS (Taxonomy nodes) */}
        <TrendingTopics />

        {/* 7. FEATURED ARTICLES GRID */}
        <FeaturedGrid />

        {/* 8. AI SECTION (Future-ready placeholder) */}
        <AISection />
      </Container>
    </main>
  );
}
