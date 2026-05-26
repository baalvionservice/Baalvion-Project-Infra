import React from 'react';
    import { Container } from '@/design-system/layout/container';
    import { Text } from '@/design-system/typography/text';
    import { Section } from '@/design-system/layout/section';

    export default function DatasetsPage() {
      return (
        <main className="min-h-screen bg-background pt-20">
          <Container>
            <Section spacing="sm">
              <Text variant="h1">Open Datasets</Text>
              <Text variant="body" className="text-muted-foreground mt-4">
                High-fidelity data nodes for institutional and independent research.
              </Text>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-card border rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 mb-4" />
                    <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                ))}
              </div>
            </Section>
          </Container>
        </main>
      );
    }
    