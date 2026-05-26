import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { calculatorsService } from '@/services/data';
import { seoService } from '@/modules/seo-engine/services/seo-service';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { schemaService } from '@/modules/seo/services/schema-service';

interface CalculatorPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Programmatic SEO page for Financial Calculators.
 */
export async function generateMetadata({ params }: CalculatorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await calculatorsService.getCalculatorList();
  const calculator = response.data.find(c => c.slug === slug);

  if (!calculator) {
    return { title: 'Calculator Not Found' };
  }

  return seoService.generateMetadata({
    title: `${calculator.name} — Free Financial Tool`,
    description: calculator.description,
    slug: calculator.slug,
    type: 'tool',
    keywords: [calculator.name, 'Financial Calculator', 'Wealth Management Tool'],
  }, '/calculators');
}

export default async function Page({ params }: CalculatorPageProps) {
  const { slug } = await params;
  const response = await calculatorsService.getCalculatorList();
  const calculator = response.data.find(c => c.slug === slug);

  if (!calculator) {
    notFound();
  }

  const toolSchema = schemaService.generateToolSchema(calculator);

  return (
    <main className="min-h-screen bg-background pt-20">
      <JsonLd data={toolSchema} />
      <Container>
        <header className="mb-12 max-w-3xl">
          <Text variant="label" className="text-secondary mb-4">{calculator.category}</Text>
          <Text variant="h1" className="mb-6">{calculator.name}</Text>
          <Text variant="body" className="text-muted-foreground text-lg">
            {calculator.description}
          </Text>
        </header>

        <div className="bg-card border rounded-3xl p-12 min-h-[400px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <div className="relative text-center z-10">
            <Text variant="h3" className="mb-4">Calculator Interface Coming Soon</Text>
            <Text variant="bodySmall" className="text-muted-foreground">
              We are currently fine-tuning the precision algorithms for the {calculator.name}.
            </Text>
          </div>
        </div>
      </Container>
    </main>
  );
}
