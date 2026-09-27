import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { fetchTrendingPrompts, fetchPromptCategories, flattenPromptItems } from '@/lib/data/prompts-live';
import { isFeatureEnabled } from '@/lib/data/site-content';
import { PromptGridSearch } from '@/components/prompts/PromptGridSearch';
import { PromptSubNav } from '@/components/prompts/PromptSubNav';
import { buildMetadata } from '@/lib/seo';
import { formatOrdinalDate, formatShortDate } from '@/lib/seo/dynamic-date';
import { structuredData } from '@/lib/seo/structured-data';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { Breadcrumbs } from '@/modules/seo-engine/components/Breadcrumbs';
import { breadcrumbService } from '@/modules/seo-engine/services/breadcrumb-service';
import { env } from '@/config/env';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const trendingEnabled = await isFeatureEnabled('trending-prompts');
  if (!trendingEnabled) {
    // Not indexed while off — nothing here for a crawler to rank, and the page itself
    // renders no trending content below (see the component).
    return buildMetadata({ noIndex: true, title: 'Trending AI Prompts' });
  }
  // Self-refreshing date pattern, same as /prompts — computed fresh on every render (this
  // page revalidates every 15 min, so the date rolls over within minutes of midnight, not
  // hours), so nobody has to remember to touch this by hand as the days pass.
  const today = new Date();
  return buildMetadata({
    canonical: '/trending-prompts',
    title: `Trending AI Prompts — Updated ${formatShortDate(today)}`,
    description: `The AI image prompts we’re featuring right now, current as of ${formatOrdinalDate(today)} — each with its real example output, updated as new ones land.`,
  });
}

// Trending is an editorial ranking, not computed — refresh more often than the
// full directory so a re-order shows up without waiting an hour.
export const revalidate = 900;

export default async function TrendingPromptsPage() {
  const [trendingEnabled, categories] = await Promise.all([
    isFeatureEnabled('trending-prompts'),
    fetchPromptCategories(),
  ]);

  // Admin-controlled kill switch — off (the default) shows nothing trending-related: no
  // cards, no tabs beyond the shared sticky nav. Turn on from Imperialpedia > Site Content >
  // New > type "feature-flag", slug "trending-prompts", content { "enabled": true }.
  if (!trendingEnabled) {
    return (
      <main className="min-h-screen bg-background pt-16 pb-32">
        <PromptSubNav categories={categories} />
        <Container className="pt-24 text-center">
          <h1 className="font-headline text-3xl font-bold text-foreground">Trending picks aren’t live yet</h1>
          <p className="mt-3 text-muted-foreground">
            Check back soon, or browse the full prompt directory in the meantime.
          </p>
          <Link href="/prompts" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Browse all prompts →
          </Link>
        </Container>
      </main>
    );
  }

  const posts = await fetchTrendingPrompts(48);
  const cards = flattenPromptItems(posts);
  const base = env.siteUrl.replace(/\/$/, '');
  const breadcrumb = breadcrumbService.build([
    { name: 'Home', item: '/' },
    { name: 'AI Prompts', item: '/prompts' },
    { name: 'Trending', item: '/trending-prompts' },
  ]);

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      {posts.length > 0 && (
        <JsonLd data={structuredData.itemList(posts.map((p) => ({
          name: p.title,
          url: `${base}/prompts/${p.slug}`,
        })))} />
      )}
      <PromptSubNav categories={categories} active="trending" />

      <div className="pt-8">
        <Container>
          <Breadcrumbs breadcrumb={breadcrumb} />
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
            Trending AI Photo Editing Prompts
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            A curated, hand-picked selection — not an algorithmic ranking. Every card links to
            the full post and its real example output.
          </p>
          <Link href="/prompts" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Browse the full prompt directory →
          </Link>
        </Container>
      </div>

      <Container className="pt-10">
        <PromptGridSearch cards={cards} emptyMessage="Nothing trending right now — check the full directory instead." />
      </Container>
    </main>
  );
}
