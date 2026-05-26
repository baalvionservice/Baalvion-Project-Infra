import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <Container>
        <Section spacing="sm" className="text-center">
          <Text variant="h1">Intelligence Access</Text>
          <Text variant="body" className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Select your tier to unlock the full depth of the Imperialpedia Index.
          </Text>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {['Free', 'Pro', 'Enterprise'].map((tier) => (
              <div key={tier} className="bg-card border rounded-3xl p-8 flex flex-col items-center">
                <Text variant="h3" className="mb-2">{tier}</Text>
                <div className="h-px w-full bg-border my-6" />
                <div className="space-y-4 w-full mb-8">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-3 w-full bg-muted rounded" />
                  ))}
                </div>
                <div className="mt-auto w-full h-12 bg-primary rounded-xl" />
              </div>
            ))}
          </div>
        </Section>
      </Container>
    </main>
  );
}
