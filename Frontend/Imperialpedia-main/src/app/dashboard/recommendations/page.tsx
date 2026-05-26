import React from 'react';
import { Container } from '@/design-system/layout/container';
import { RecommendationsClient } from './RecommendationsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { Text } from '@/design-system/typography/text';

export const metadata: Metadata = buildMetadata({
  title: 'For You | Personalized Intelligence',
  description: 'Explore financial intelligence and asset recommendations tailored specifically to your expertise and portfolio goals.',
});

/**
 * Personalized Feed & Recommendations Page (Server Entry).
 * Orchestrates the discovery of high-value intelligence nodes tailored to the active user.
 */
export default function UserRecommendationsPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <Text variant="label" className="font-bold tracking-widest text-primary">Intelligence Architect</Text>
          </div>
          <Text variant="h1" className="text-4xl font-bold tracking-tight">Personalized For You</Text>
          <Text variant="body" className="text-muted-foreground text-lg max-w-2xl mt-2">
            AI-vetted research and asset matches synchronized with your unique financial profile.
          </Text>
        </header>

        <RecommendationsClient />
      </Container>
    </main>
  );
}
