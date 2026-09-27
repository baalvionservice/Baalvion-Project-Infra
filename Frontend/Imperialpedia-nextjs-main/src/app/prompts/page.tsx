import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { fetchAllPrompts, fetchPromptCategories, fetchGalleryImages, promptRealImage } from '@/lib/data/prompts-live';
import { PromptSearchGrid } from '@/components/prompts/PromptSearchGrid';
import { PromptCategoryTabs } from '@/components/prompts/PromptCategoryTabs';
import { PromptSubNav } from '@/components/prompts/PromptSubNav';
import { PromptPagination } from '@/components/prompts/PromptPagination';
import { PromptHomeContent } from '@/components/prompts/PromptHomeContent';
import { RotatingWord } from '@/components/prompts/RotatingWord';
import { VerticalPhotoWall } from '@/components/prompts/VerticalPhotoWall';
import { PhotoMarqueeStrip } from '@/components/prompts/PhotoMarqueeStrip';
import { getLocalGalleryPhotos } from '@/lib/data/local-gallery';
import { buildMetadata } from '@/lib/seo';
import { formatOrdinalDate, formatShortDate } from '@/lib/seo/dynamic-date';
import { structuredData } from '@/lib/seo/structured-data';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { Breadcrumbs } from '@/modules/seo-engine/components/Breadcrumbs';
import { breadcrumbService } from '@/modules/seo-engine/services/breadcrumb-service';
import { env } from '@/config/env';
import { Metadata } from 'next';
import { Flame } from 'lucide-react';

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  // Page 1's title/description carry today's date, recomputed on every render (see
  // `revalidate` below) — no one has to remember to edit this by hand as the days pass.
  // Paginated pages skip the date (it'd be identical across every page number and just
  // look repetitive in search results) and use a static, page-numbered title instead.
  const today = new Date();
  return buildMetadata({
    canonical: page > 1 ? `/prompts?page=${page}` : '/prompts',
    title: page > 1
      ? `AI Prompt Gallery — Page ${page}`
      : `AI Photo Prompts — Updated ${formatShortDate(today)}`,
    description: page > 1
      ? 'Viral AI photo editing prompts, tested and ready to copy — Gemini and ChatGPT prompts with real example output.'
      : `AI photo editing prompts for Gemini & ChatGPT, current as of ${formatOrdinalDate(today)} — real, tested prompts with the exact example image each one produced.`,
  });
}

export const revalidate = 3600;

const PAGE_SIZE = 24;

export default async function PromptsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1'));
  const [{ items, total }, categories, galleryImages] = await Promise.all([
    fetchAllPrompts({ page, limit: PAGE_SIZE }),
    fetchPromptCategories(),
    fetchGalleryImages(6),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = env.siteUrl.replace(/\/$/, '');
  const breadcrumb = breadcrumbService.build([
    { name: 'Home', item: '/' },
    { name: 'AI Prompts', item: '/prompts' },
  ]);

  // Local photo set — drop files into public/prompts/gallery and they show up here automatically.
  const localPhotos = getLocalGalleryPhotos();

  // Seeded posts still point at the "pending" placeholder until real example images are
  // uploaded per-post — until then, show the real photo set instead of a wall of placeholders.
  const realGalleryImages = galleryImages.filter((img) => !img.url.includes('placeholder-pending'));
  const stripPhotos = realGalleryImages.length > 0
    ? realGalleryImages.map((img) => img.url)
    : localPhotos;

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <PromptSubNav categories={categories} />
      {items.length > 0 && (
        <JsonLd data={structuredData.itemList(items.map((p) => ({
          name: p.title,
          url: `${base}/prompts/${p.slug}`,
          image: promptRealImage(p)?.url,
        })))} />
      )}

      {/* Hero — black band so the photo wall gets real contrast */}
      <div className="bg-black pt-10 pb-16">
        <Container>
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-headline text-4xl md:text-5xl font-bold leading-tight text-white max-w-3xl mx-auto lg:mx-0">
                Viral AI Photo Editing Prompts — Tested &amp; Ready to Copy
              </h1>
              <p className="mt-4 text-xl text-white/70">
                Find the <RotatingWord words={['Latest', 'Trending', 'Seasonal', 'Festival', 'Viral']} /> Prompts Easily
              </p>
              <p className="mt-4 max-w-xl mx-auto lg:mx-0 text-white/60">
                Real AI photo editing prompts for Gemini &amp; ChatGPT — each one ships with the exact
                example image it produced.
              </p>
            </div>
            <div className="w-full max-w-xs mx-auto lg:mx-0 lg:w-72">
              <VerticalPhotoWall photos={localPhotos} />
            </div>
          </div>
        </Container>
      </div>

      {/* Quick gallery strip — auto-scrolling left to right, a real cross-section of what's inside */}
      {stripPhotos.length > 0 && (
        <div className="mt-10 mb-14">
          <PhotoMarqueeStrip photos={stripPhotos} />
        </div>
      )}

      <Container>
        <Breadcrumbs breadcrumb={breadcrumb} className="justify-center" />
        <h2 className="font-headline text-3xl font-bold text-center text-foreground mb-8">
          Browse All Prompts
        </h2>

        <div className="mb-8">
          <PromptCategoryTabs categories={categories} />
        </div>

        {items.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">No prompts published yet — check back soon.</p>
        ) : (
          <>
            <PromptSearchGrid items={items} />
            <PromptPagination currentPage={page} totalPages={totalPages} basePath="/prompts" />
          </>
        )}

        <div className="mt-12 text-center">
          <Link href="/trending-prompts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <Flame size={16} /> See what&apos;s trending →
          </Link>
        </div>
      </Container>

      <PromptHomeContent categories={categories} />
    </main>
  );
}
