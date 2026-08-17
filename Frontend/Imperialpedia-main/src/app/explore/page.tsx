import React from "react";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { buildMetadata } from "@/lib/seo/metadata-builder";
import { Metadata } from "next";
import { Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildMetadata({
  canonical: '/explore',
  title: "Explore Global Knowledge",
  description:
    "Navigate the Imperialpedia Index. Discover country profiles in one structured knowledge base.",
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
            variant="h1" as="h1"
            className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight"
          >
            Explore <span className="text-primary">Global Knowledge</span>
          </Text>
          <Text
            variant="body"
            className="text-muted-foreground text-xl leading-relaxed max-w-2xl mb-12"
          >
            Browse country profiles — each linked to related entities and
            relevant articles.
          </Text>

          {/* Expanded Search Entry */}
          <ExploreClient />
        </header>

        {/* Learn More Callout */}
        <footer className="mt-32 p-12 lg:p-20 rounded-[3.5rem] bg-primary/5 border border-primary/20 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <TrendingUp size={300} className="text-primary" />
          </div>
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <Badge
              variant="outline"
              className="border-primary/30 text-primary uppercase font-bold tracking-widest text-[10px] px-4 h-7 mb-4"
            >
              Keep Exploring
            </Badge>
            <Text variant="h2" className="text-3xl font-bold">
              New profiles added regularly
            </Text>
            <Text variant="body" className="text-muted-foreground">
              Every country profile links to related entities and articles,
              so you can keep following a topic as far as it goes.
            </Text>
            <div className="pt-6">
              <Button
                size="lg"
                className="rounded-2xl h-14 px-10 font-bold shadow-xl shadow-primary/20"
                asChild
              >
                <Link href="/latest">See the latest articles</Link>
              </Button>
            </div>
          </div>
        </footer>
      </Container>
    </main>
  );
}
