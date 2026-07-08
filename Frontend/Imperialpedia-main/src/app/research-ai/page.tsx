import React from 'react';
    import { Container } from '@/design-system/layout/container';
    import { Text } from '@/design-system/typography/text';
    import { Section } from '@/design-system/layout/section';
    import { buildMetadata } from '@/lib/seo';

    // Stub page — no working AI input yet ("AI Input Placeholder" below), so it's
    // kept out of the index rather than competing with real pages as thin content.
    export const metadata = buildMetadata({
      title: 'Research AI',
      description: 'Ask complex questions and receive synthesized financial intelligence.',
      canonical: '/research-ai',
      noIndex: true,
    });

    export default function ResearchAIPage() {
      return (
        <main className="min-h-screen bg-background pt-20">
          <Container>
            <Section spacing="sm">
              <Text variant="h1">Research AI</Text>
              <Text variant="body" className="text-muted-foreground mt-4">
                Ask complex questions and receive synthesized financial intelligence.
              </Text>
              <div className="mt-12 max-w-2xl mx-auto h-32 bg-card border rounded-2xl flex items-center justify-center text-muted-foreground">
                AI Input Placeholder
              </div>
            </Section>
          </Container>
        </main>
      );
    }
    