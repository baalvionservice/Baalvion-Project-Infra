import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { ListChecks } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import stockLists from '@/data/stock-lists/stock-lists.json';

export const metadata: Metadata = buildMetadata({
  canonical: '/stocks/lists',
  title: 'Stock Lists | Dividend, Growth, AI, Tech & Sector Stocks',
  description: 'Browse curated stock lists by theme and sector, including dividend stocks, AI stocks, technology stocks, and more.',
});

export default function StockListsIndexPage() {
  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
                <ListChecks size={24} />
              </div>
              <Badge variant="outline" className="text-secondary border-secondary/30 font-bold tracking-widest uppercase text-[10px]">
                Stock Lists
              </Badge>
            </div>
            <Text variant="h1" as="h1" className="mb-6">Browse Stocks by List</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              Curated groupings of companies by theme and sector — a starting point for research, not a
              recommendation to buy any specific stock.
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed mt-4">
              Each list below groups companies that share a common theme, sector, or investment
              characteristic — dividend payers, large-cap blue chips, semiconductor makers, and similar
              groupings that investors commonly use as a research starting point rather than a ranked or
              model portfolio. Membership in a list is based on the underlying business and financial
              characteristics that define the theme (for example, a sustained dividend history for the
              dividend-stocks list, or chip design and manufacturing for the semiconductor list), not
              short-term price performance. Open any list to see its full methodology and the companies
              currently included.
            </Text>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stockLists.map((list) => (
              <Link
                key={list.slug}
                href={`/stocks/lists/${list.slug}`}
                className="group block rounded-2xl border border-border p-6 transition-colors hover:border-primary"
              >
                <h3 className="text-lg font-bold text-foreground group-hover:underline mb-2">{list.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{list.description}</p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
