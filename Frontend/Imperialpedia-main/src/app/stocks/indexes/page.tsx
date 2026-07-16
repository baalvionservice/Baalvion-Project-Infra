import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import indexes from '@/data/indexes/indexes.json';

export const metadata: Metadata = buildMetadata({
  canonical: '/stocks/indexes',
  title: 'Stock Market Indexes | S&P 500, Nasdaq, Dow Jones & More',
  description: 'Learn how major world stock market indexes work, including the S&P 500, Nasdaq Composite, Dow Jones, FTSE 100, Nikkei 225, Sensex, and Nifty 50.',
});

export default function IndexesPage() {
  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
                <BarChart3 size={24} />
              </div>
              <Badge variant="outline" className="text-secondary border-secondary/30 font-bold tracking-widest uppercase text-[10px]">
                Market Indexes
              </Badge>
            </div>
            <Text variant="h1" as="h1" className="mb-6">World Stock Market Indexes</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              An index tracks a basket of stocks to measure how a market or segment of it is performing.
              Explore how the world&apos;s most-followed benchmarks are built.
            </Text>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {indexes.map((idx) => (
              <Link
                key={idx.slug}
                href={`/stocks/indexes/${idx.slug}`}
                className="group block rounded-2xl border border-border p-6 transition-colors hover:border-primary"
              >
                <p className="text-xs font-semibold text-primary mb-1">{idx.country}</p>
                <h2 className="text-lg font-bold text-foreground group-hover:underline mb-2">{idx.name}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{idx.description}</p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
