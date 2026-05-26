import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { ArticleList } from '@/modules/content-engine/components';
import { getTagBySlug, getArticlesByTag } from '@/modules/content-engine/services/tag-service';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Tag as TagIcon, Sparkles } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/modules/seo-engine/components/Breadcrumbs';
import { breadcrumbService } from '@/modules/seo-engine/services/breadcrumb-service';
import { linkService } from '@/modules/seo/services/link-service';
import Link from 'next/link';

interface TagRouteProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates dynamic SEO metadata for the tag archive page.
 */
export async function generateMetadata({ params }: TagRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await getTagBySlug(slug);
  const tag = response.data;

  if (!tag) {
    return buildMetadata({
      title: 'Topic Not Found',
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${tag.name} Intelligence`,
    description: tag.description || `Explore expert analysis and financial insights related to ${tag.name}.`,
  });
}

/**
 * Tag Archive Page Component.
 */
export default async function TagPage({ params }: TagRouteProps) {
  const { slug } = await params;

  const [tagResponse, articlesResponse, relatedTopics] = await Promise.all([
    getTagBySlug(slug),
    getArticlesByTag(slug),
    linkService.getRelatedTopics(slug)
  ]);

  const tag = tagResponse.data;
  const articles = articlesResponse.data;

  if (!tag) {
    notFound();
  }

  const breadcrumbs = breadcrumbService.generateBreadcrumbForTag(tag);

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="sm">
        <Container>
          <Breadcrumbs breadcrumb={breadcrumbs} />
          
          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 shadow-sm">
                <TagIcon className="w-6 h-6 text-secondary" />
              </div>
              <Badge variant="outline" className="text-secondary border-secondary/30 uppercase tracking-widest text-[10px] font-bold">
                Topic Archive
              </Badge>
            </div>
            
            <Text variant="h1" className="mb-4 text-4xl lg:text-6xl font-bold">
              {tag.name}
            </Text>
            
            {tag.description && (
              <Text variant="body" className="text-muted-foreground text-lg mb-6 leading-relaxed">
                {tag.description}
              </Text>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 w-fit px-4 py-2 rounded-full border">
              <span className="font-bold text-foreground">{articles.length}</span>
              <span>specialized insights available</span>
            </div>
          </header>
          
          <div className="mt-12">
            <ArticleList articles={articles} />
          </div>

          <footer className="mt-24 pt-12 border-t">
            <div className="flex items-center gap-2 text-secondary mb-8">
              <Sparkles className="h-5 w-5" />
              <Text variant="h4">Explore Adjacent Topics</Text>
            </div>
            <div className="flex flex-wrap gap-3">
              {relatedTopics.map((topic) => (
                <Link key={topic.slug} href={`/tags/${topic.slug}`}>
                  <Badge variant="outline" className="px-4 py-2 hover:bg-secondary/10 hover:text-secondary transition-colors text-sm border-secondary/20">
                    {topic.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </footer>
        </Container>
      </Section>
    </main>
  );
}
