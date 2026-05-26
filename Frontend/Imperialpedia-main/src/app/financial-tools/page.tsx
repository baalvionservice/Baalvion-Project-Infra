import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { getCalculatorList } from '@/services/mock-api/calculators';
import { CalculatorCard } from '@/modules/calculators/components/CalculatorCard';
import { PieChart, Calculator as CalcIcon, Sparkles } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Financial Planning Hub | Imperialpedia',
  description: 'Precision instruments for wealth planning. Explore our suite of compound interest, loan, and investment calculators.',
});

/**
 * Main dashboard for the Financial Tools Platform.
 * Aggregates all interactive calculators with categorized discovery.
 */
export default async function FinancialToolsDashboard() {
  const response = await getCalculatorList();
  const tools = response.data;

  // Group tools by category for structured display
  const categories = Array.from(new Set(tools.map(t => t.category)));

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <Section spacing="md">
        <Container>
          <header className="mb-20 max-w-4xl">
            <div className="flex items-center gap-3 text-primary mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <PieChart className="h-6 w-6" />
              </div>
              <Text variant="label" className="font-bold tracking-widest uppercase">Interactive Intelligence</Text>
            </div>
            <Text variant="h1" className="text-4xl lg:text-7xl font-bold mb-6 tracking-tight">
              Interactive <span className="text-primary">Planning Hub</span>
            </Text>
            <Text variant="body" className="text-muted-foreground text-xl leading-relaxed max-w-3xl">
              Master your financial future with our suite of precision instruments. From debt management to retirement modeling, our tools provide the clarity you need to navigate complex fiscal decisions.
            </Text>
          </header>

          <div className="space-y-24">
            {categories.map((category) => (
              <div key={category} className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-white/5 flex items-center justify-center shadow-inner">
                    <CalcIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <Text variant="h3" className="font-bold">{category}</Text>
                    <div className="h-1 w-12 bg-primary rounded-full mt-1 opacity-50" />
                  </div>
                  <div className="flex-grow h-px bg-gradient-to-r from-border to-transparent ml-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tools
                    .filter(t => t.category === category)
                    .map((tool) => (
                      <CalculatorCard key={tool.id} tool={tool} />
                    ))
                  }
                </div>
              </div>
            ))}
          </div>

          <Section spacing="lg" className="mt-32">
            <div className="p-12 lg:p-20 rounded-[3.5rem] bg-primary/5 border border-primary/20 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110 duration-1000" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <Text variant="h2" className="mb-4">Custom Modeling Required?</Text>
                  <Text variant="body" className="text-muted-foreground text-lg">
                    The Imperialpedia Index is constantly expanding. If you require a specialized calculator for institutional or private wealth research, our engineering team can architect it.
                  </Text>
                </div>
                <button className="px-12 h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                  Request Precision Tool
                </button>
              </div>
            </div>
          </Section>
        </Container>
      </Section>
    </main>
  );
}
