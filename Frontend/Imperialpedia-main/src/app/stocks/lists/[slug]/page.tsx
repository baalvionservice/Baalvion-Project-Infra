import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ListChecks } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { structuredData } from '@/lib/seo/structured-data';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { loadCompanies } from '@/lib/data/loaders';
import { EntityList } from '@/components/lists/EntityList';
import { getSiteContent } from '@/lib/data/site-content';
import stockLists from '@/data/stock-lists/stock-lists.json';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface StockListFaq {
  question: string;
  answer: string;
}

function findList(slug: string) {
  return stockLists.find((l) => l.slug === slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = findList(slug);
  if (!list) return { title: 'List Not Found' };
  return buildMetadata({
    canonical: `/stocks/lists/${slug}`,
    title: `${list.name} | Imperialpedia`,
    description: list.description,
  });
}

export function generateStaticParams() {
  return stockLists.map((l) => ({ slug: l.slug }));
}

export default async function StockListDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const list = findList(slug);
  if (!list) notFound();

  const companies = await loadCompanies();
  const matched = companies.filter((c) => c.tags.some((t) => list.matchTags.includes(t)));

  // Admin-managed override (Imperialpedia > Site Content, type "stock-list")
  // takes precedence over the bundled default in stock-lists.json.
  const live = await getSiteContent<{ longDescription?: string; faq?: StockListFaq[] }>('stock-list', slug);
  const longDescription = live?.longDescription ?? list.longDescription;
  const faq = live?.faq ?? list.faq ?? [];

  // FAQPage schema only ever built from real, editorially-authored Q&A pairs —
  // never generated/guessed — same convention as the company FAQ block on
  // /markets/quote/[symbol].
  const faqSchema = faq.length > 0 ? structuredData.faq(faq) : null;

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      {faqSchema && <JsonLd data={faqSchema} />}
      <Section spacing="md">
        <Container>
          <Link href="/stocks/lists" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> All Stock Lists
          </Link>

          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
                <ListChecks size={24} />
              </div>
              <Badge variant="outline" className="text-secondary border-secondary/30 font-bold tracking-widest uppercase text-[10px]">
                Stock List
              </Badge>
            </div>
            <Text variant="h1" as="h1" className="mb-6">{list.name}</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              {list.description} This is an educational grouping, not a recommendation to buy or sell any
              security.
            </Text>
            {longDescription && (
              <Text variant="body" className="text-muted-foreground leading-relaxed mt-4">
                {longDescription}
              </Text>
            )}
          </header>

          <EntityList entities={matched} type="company" totalCount={matched.length} />

          {faq.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border max-w-3xl">
              <Text variant="h3" as="h3" className="mb-4">Frequently Asked Questions</Text>
              <div className="space-y-5">
                {faq.map((f) => (
                  <div key={f.question}>
                    <Text variant="body" className="font-semibold text-foreground">{f.question}</Text>
                    <Text variant="body" className="text-muted-foreground mt-1">{f.answer}</Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
