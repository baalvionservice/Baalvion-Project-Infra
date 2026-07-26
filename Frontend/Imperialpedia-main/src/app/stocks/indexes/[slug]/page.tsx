import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { getSiteContent } from '@/lib/data/site-content';
import indexes from '@/data/indexes/indexes.json';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function findIndex(slug: string) {
  return indexes.find((i) => i.slug === slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const idx = findIndex(slug);
  if (!idx) return { title: 'Index Not Found' };
  return buildMetadata({
    canonical: `/stocks/indexes/${slug}`,
    title: `${idx.name} Explained | Imperialpedia`,
    description: idx.description,
  });
}

export function generateStaticParams() {
  return indexes.map((idx) => ({ slug: idx.slug }));
}

export default async function IndexDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const idx = findIndex(slug);
  if (!idx) notFound();

  // Admin-managed override (Imperialpedia > Site Content, type "market-index")
  // takes precedence over the bundled default in indexes.json.
  const live = await getSiteContent<{ investorNote?: string }>('market-index', slug);
  const investorNote = live?.investorNote ?? idx.investorNote;

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <Section spacing="md">
        <Container isNarrow>
          <Link href="/stocks/indexes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> All Indexes
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
              <BarChart3 size={24} />
            </div>
            <Badge variant="outline" className="text-secondary border-secondary/30 font-bold tracking-widest uppercase text-[10px]">
              {idx.country}
            </Badge>
          </div>
          <Text variant="h1" as="h1" className="mb-6">{idx.name}</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed mb-10">
            {idx.description}
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Operator</p>
              <p className="text-sm font-bold text-foreground">{idx.operator}</p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Launched</p>
              <p className="text-sm font-bold text-foreground">{idx.launched_year}</p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Country</p>
              <p className="text-sm font-bold text-foreground">{idx.country}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <Text variant="h3" as="h3" className="mb-2">Methodology</Text>
              <Text variant="body" className="text-muted-foreground leading-relaxed">{idx.methodology}</Text>
            </div>
            {investorNote && (
              <div>
                <Text variant="h3" as="h3" className="mb-2">How Investors Use This Index</Text>
                <Text variant="body" className="text-muted-foreground leading-relaxed">{investorNote}</Text>
              </div>
            )}
            <div>
              <Text variant="h3" as="h3" className="mb-3">Major Sectors</Text>
              <div className="flex flex-wrap gap-2">
                {idx.major_sectors.map((sector) => (
                  <Badge key={sector} variant="outline">{sector}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Text variant="h3" as="h3" className="mb-4">Related Reading</Text>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/financial-intelligence/what-is-the-stock-market" className="text-sm font-semibold text-primary hover:underline">
                What Is the Stock Market?
              </Link>
              <Link href="/financial-intelligence/index-investing-strategy" className="text-sm font-semibold text-primary hover:underline">
                Index Investing Strategy Explained
              </Link>
              <Link href="/stocks" className="text-sm font-semibold text-primary hover:underline">
                Back to Stocks
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
