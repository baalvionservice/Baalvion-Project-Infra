import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata-builder';

/**
 * @fileOverview Specialized SEO utility for the Imperialpedia landing page.
 * Orchestrates the primary search engine and social signals for the platform root.
 * Aligned with Prompt 81 requirements for institutional metadata.
 */

export function generateLandingMetadata(): Metadata {
  return buildMetadata({
    title: "Imperialpedia — The World's AI Knowledge Engine",
    description: "Research anything instantly with structured global data. AI-powered knowledge engine for investors, startups, journalists, and researchers.",
    keywords: [
      "AI knowledge engine", 
      "structured data", 
      "global research", 
      "investors", 
      "startups", 
      "journalists", 
      "datasets"
    ],
    ogImage: "/og-image.png",
    ogType: "website",
    canonical: "/",
  });
}

// TODO: AI-driven meta title and description suggestions
// TODO: Dynamic structured data for new categories and pages
// TODO: Analytics tracking for SEO performance
