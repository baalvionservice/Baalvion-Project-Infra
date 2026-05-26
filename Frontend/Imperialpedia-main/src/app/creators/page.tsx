import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { getCreators } from '@/services/data';
import { CreatorDiscoveryClient } from './CreatorDiscoveryClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Users as UsersIcon } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Expert Creator Network',
  description: 'Connect with the world\'s leading financial minds. Browse our directory of verified experts, analysts, and wealth strategists.',
});

/**
 * Creator Discovery Page (Server Entry).
 * Fetches initial creator data and hands off to the interactive client component.
 */
export default async function CreatorsDiscoveryPage() {
  const response = await getCreators();
  const creators = response.data;

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="md">
        <Container>
          <header className="mb-16 max-w-3xl">
            <div className="flex items-center gap-2 text-primary mb-4">
              <UsersIcon className="h-5 w-5" />
              <Text variant="label" className="font-bold tracking-widest">Global Network</Text>
            </div>
            <Text variant="h1" className="mb-6">Financial Intelligence Experts</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              Connect with specialized creators who power the Imperialpedia index. From macro-economists to DeFi analysts, find the expertise you need to navigate the markets.
            </Text>
          </header>

          <CreatorDiscoveryClient initialCreators={creators} />
        </Container>
      </Section>
    </main>
  );
}
