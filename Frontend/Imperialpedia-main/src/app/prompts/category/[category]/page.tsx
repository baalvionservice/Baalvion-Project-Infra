import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { fetchAllPrompts, fetchPromptCategories, flattenPromptItems } from '@/lib/data/prompts-live';
import { PromptGridSearch } from '@/components/prompts/PromptGridSearch';
import { PromptSubNav } from '@/components/prompts/PromptSubNav';
import { categoryLabel, CATEGORY_DESCRIPTIONS } from '@/config/prompt-categories';
import { buildMetadata } from '@/lib/seo';
import { structuredData } from '@/lib/seo/structured-data';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { Breadcrumbs } from '@/modules/seo-engine/components/Breadcrumbs';
import { breadcrumbService } from '@/modules/seo-engine/services/breadcrumb-service';
import { env } from '@/config/env';
import { Metadata } from 'next';
import { Flame } from 'lucide-react';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const { items } = await fetchAllPrompts({ category, limit: 1 });
  const label = categoryLabel(category);

  if (items.length === 0) return buildMetadata({ noIndex: true, title: `${label} prompts` });

  // The real, hand-written per-category description (same one used in the "Explore Prompt
  // Categories" section) drives the meta description here — each category reads as its own
  // distinct sentence, not one template with only the category name swapped in, which search
  // engines read as duplicate/thin content across every category page.
  const description = CATEGORY_DESCRIPTIONS[category]
    ? `${CATEGORY_DESCRIPTIONS[category]} Real output, tested for Gemini & ChatGPT.`
    : `Real ${label} AI photo editing prompts for Gemini and ChatGPT, each with the exact example output it produced.`;

  return buildMetadata({
    canonical: `/prompts/category/${category}`,
    title: `${label} AI Photo Prompts`,
    description,
  });
}

export const revalidate = 3600;

export default async function PromptCategoryPage({ params }: Props) {
  const { category } = await params;
  const [{ items }, categories] = await Promise.all([
    fetchAllPrompts({ category, limit: 100 }),
    fetchPromptCategories(),
  ]);
  if (items.length === 0) notFound();

  const cards = flattenPromptItems(items);
  const label = categoryLabel(category);
  const base = env.siteUrl.replace(/\/$/, '');
  const breadcrumb = breadcrumbService.build([
    { name: 'Home', item: '/' },
    { name: 'AI Prompts', item: '/prompts' },
    { name: label, item: `/prompts/category/${category}` },
  ]);

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <JsonLd data={structuredData.itemList(items.map((p) => ({
        name: p.title,
        url: `${base}/prompts/${p.slug}`,
      })))} />
      <PromptSubNav categories={categories} active={category} />

      <div className="pt-8">
        <Container>
          <Breadcrumbs breadcrumb={breadcrumb} />
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
            {label} AI Photo Editing Prompts
          </h1>
          <p className="mt-2 text-muted-foreground">
            Explore {cards.length} curated {label} AI photo editing prompt{cards.length === 1 ? '' : 's'} — real, tested, ready to copy for Gemini &amp; ChatGPT.
          </p>
        </Container>
      </div>

      <Container className="pt-10">
        <PromptGridSearch cards={cards} emptyMessage={`No ${label} prompts published yet.`} />

        <Link href="/trending-prompts" className="mt-12 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <Flame size={16} /> See what&apos;s trending →
        </Link>
      </Container>
    </main>
  );
}
