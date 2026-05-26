import React from "react";
import { Container } from "@/design-system/layout/container";
import { Section } from "@/components/ui/Section";
import { Text } from "@/design-system/typography/text";
import { ExploreCategories } from "@/components/explore/ExploreCategories";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { buildMetadata } from "@/lib/seo/metadata-builder";
import { Metadata } from "next";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  title: "Explore Global Knowledge",
  description:
    "Navigate the Imperialpedia Index. Discover countries, companies, industries, and technologies across our 1M+ intelligence nodes.",
});

/**
 * The Explore Discovery Hub.
 * Acts as the high-fidelity entry point for platform-wide knowledge traversal.
 */
export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container>
        {/* Hero Section */}
        <header className="mb-20 max-w-4xl">
          <div className="flex items-center gap-2 text-primary mb-6 animate-in fade-in slide-in-from-left-4 duration-700">
            <Sparkles size={20} />
            <Text variant="label" className="font-bold tracking-widest">
              Knowledge Discovery Engine
            </Text>
          </div>
          <Text
            variant="h1"
            className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight"
          >
            Explore <span className="text-primary">Global Knowledge</span>
          </Text>
          <Text
            variant="body"
            className="text-muted-foreground text-xl leading-relaxed max-w-2xl mb-12"
          >
            Audit the world's most scalable intelligence network. Traverse
            interconnected nodes across every financial and technical domain.
          </Text>

          {/* Expanded Search Entry */}
          <ExploreClient />
        </header>

        {/* Discovery Categories */}
        <ExploreCategories />

        {/* Trending Section */}
        <Section
          title="High-Impact Topics"
          className="mt-24 pt-12 border-t border-white/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Artificial Intelligence",
                href: "/technologies/generative-ai",
              },
              { label: "Semiconductors", href: "/industries/semiconductors" },
              { label: "Global Finance", href: "/industries/finance" },
              {
                label: "Economic Benchmarks",
                href: "/countries/united-states",
              },
            ].map((topic) => (
              <Link key={topic.label} href={topic.href} className="group">
                <div className="p-6 rounded-2xl bg-card/30 border border-white/5 hover:border-primary/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <Text
                      variant="bodySmall"
                      weight="bold"
                      className="group-hover:text-primary transition-colors"
                    >
                      {topic.label}
                    </Text>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  />
                </div>
              </Link>
            ))}
          </div>
        </Section>

        {/* Scalability Callout */}
        <footer className="mt-32 p-12 lg:p-20 rounded-[3.5rem] bg-primary/5 border border-primary/20 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <TrendingUp size={300} className="text-primary" />
          </div>
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <Badge
              variant="outline"
              className="border-primary/30 text-primary uppercase font-bold tracking-widest text-[10px] px-4 h-7 mb-4"
            >
              Scale Telemetry
            </Badge>
            <Text variant="h2" className="text-3xl font-bold">
              1,000,000+ Intelligence Nodes
            </Text>
            <Text variant="body" className="text-muted-foreground">
              Our programmatic SEO engine index is constantly expanding. Every
              node is cross-referenced via our institutional-grade knowledge
              graph to ensure structural data integrity.
            </Text>
            <div className="pt-6">
              <Button
                size="lg"
                className="rounded-2xl h-14 px-10 font-bold shadow-xl shadow-primary/20"
              >
                Register for Analyst Access
              </Button>
            </div>
          </div>
        </footer>
      </Container>
    </main>
  );
}
