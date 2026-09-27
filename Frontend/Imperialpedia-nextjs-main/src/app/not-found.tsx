import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { SearchX, ArrowLeft, Sparkles } from 'lucide-react';
import { InlineSearchBar } from '@/components/search/InlineSearchBar';
import { getArticles } from '@/modules/content-engine/services/content-service';
import { newsArticleHref } from '@/lib/data/article-url';
import { articleArtDataUri } from '@baalvion/illustrations';

/**
 * 404 page. Server component, so a broken link always renders something
 * useful even if the CMS/API is unreachable — `getArticles` falls back to a
 * bundled article set rather than throwing (see content-service.ts). Offers a
 * real, working search bar and real trending articles instead of a dead end.
 */
export default async function NotFound() {
  const { data: trending } = await getArticles(1, 6);

  return (
    <main className="min-h-screen bg-background py-20 animate-in fade-in duration-700">
      <Container className="max-w-2xl text-center space-y-10">
        <div className="space-y-6">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[2rem] bg-muted/50" />
            <SearchX className="h-10 w-10 text-muted-foreground relative z-10" />
          </div>

          <div className="space-y-2">
            <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">Page not found</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or may have moved. Try searching, or head back to the homepage.
            </Text>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <InlineSearchBar placeholder="Search companies, countries, articles..." />
        </div>

        <Button variant="outline" className="h-12 rounded-xl font-bold border-white/10 bg-card/30 gap-2" asChild>
          <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to Homepage</Link>
        </Button>
      </Container>

      {trending.length > 0 && (
        <Container className="max-w-5xl mt-20 pt-16 border-t border-white/5">
          <div className="flex items-center justify-center gap-2 text-primary mb-10">
            <Sparkles className="h-4 w-4" />
            <Text variant="label" className="text-xs font-bold uppercase tracking-widest">
              Trending on Imperialpedia
            </Text>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trending.map((article) => {
              const href = newsArticleHref({
                slug: article.slug,
                publishedAt: article.publishedAt || article.updatedAt,
                contentType: article.contentType,
                categorySlug: article.categorySlug,
              });
              const img =
                article.featuredImage ||
                articleArtDataUri({ title: article.title, category: article.category, seed: article.slug });

              return (
                <Link key={article.id} href={href} className="group block">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted mb-3">
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <Text variant="bodySmall" weight="bold" className="group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </Text>
                </Link>
              );
            })}
          </div>
        </Container>
      )}
    </main>
  );
}
