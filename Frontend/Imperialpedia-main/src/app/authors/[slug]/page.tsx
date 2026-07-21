import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArticleList } from '@/modules/content-engine/components';
import { getArticles, getArticlesByAuthor } from '@/modules/content-engine/services';
import { staticArticleList } from '@/services/data/static-content';
import { getPublicAuthors, resolveAuthor } from '@/services/data/cms-public';
import { getAllAuthors } from '@/config/authors';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { Breadcrumbs } from '@/modules/seo-engine/components/Breadcrumbs';
import { breadcrumbService } from '@/modules/seo-engine/services/breadcrumb-service';
import { structuredData } from '@/lib/seo/structured-data';
import { env } from '@/config/env';
import { Metadata } from 'next';
import { Twitter, Linkedin, Globe, PlayCircle, BadgeCheck, Newspaper } from 'lucide-react';

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export async function generateStaticParams() {
  const live = await getPublicAuthors();
  const slugs = new Set<string>([...live.map((a) => a.slug), ...getAllAuthors().map((a) => a.slug)]);
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await resolveAuthor(slug);

  if (!author) {
    return buildMetadata({ title: 'Author Not Found', noIndex: true });
  }

  return buildMetadata({
    title: `${author.name} — ${author.title}`,
    description: author.bio,
    ogImage: author.avatarUrl,
    ogType: 'profile',
    canonical: `/authors/${author.slug}`,
  });
}

/**
 * Author profile page. Sourced from the admin-managed cms_authors record when one
 * exists (photo, video, bio, socials — editable from admin-platform's CMS → Authors
 * screen), with the static roster as an offline fallback. Articles are matched via
 * customFields.authorSlug on each content item; until editors tag content per author,
 * we fall back to the full published library so the page is never empty.
 */
export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await resolveAuthor(slug);

  if (!author) {
    notFound();
  }

  const byAuthor = await getArticlesByAuthor(author.slug, 1, 100);
  let articles = byAuthor.data ?? [];

  if (articles.length === 0) {
    const response = await getArticles(1, 100);
    const live = response.data ?? [];
    const bySlug = new Map(staticArticleList().map((a) => [a.slug, a]));
    for (const a of live) if (!bySlug.has(a.slug)) bySlug.set(a.slug, a);
    articles = [...bySlug.values()];
  }

  articles = articles.sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });
  const totalReadingMinutes = articles.reduce((sum, a) => sum + (a.readingTime || 0), 0);

  const profileUrl = `${env.siteUrl}/authors/${author.slug}`;
  const sameAs = [author.social.twitter, author.social.linkedin, author.social.website].filter(
    (v): v is string => Boolean(v)
  );
  const personSchema = structuredData.person({
    name: author.name,
    jobTitle: author.title,
    description: author.bio,
    url: profileUrl,
    image: author.avatarUrl,
    sameAs: sameAs.length ? sameAs : undefined,
  });
  const breadcrumb = breadcrumbService.generateBreadcrumbForAuthor(author.name, author.slug);
  const roleBadge =
    author.role === 'reviewer'
      ? 'Editorial Reviewer'
      : author.role === 'fact-checker'
        ? 'Fact-Checking Editor'
        : 'Staff Writer';

  return (
    <main className="min-h-screen bg-background pt-16">
      <JsonLd data={personSchema} />
      <Section spacing="md">
        <Container>
          <Breadcrumbs breadcrumb={breadcrumb} />

          <Card className="glass-card border-none shadow-2xl mb-16 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
            <CardContent className="p-8 lg:p-14 relative z-10">
              <div className="flex flex-col lg:flex-row gap-10 lg:items-center">
                <Avatar className="h-36 w-36 lg:h-44 lg:w-44 shrink-0 ring-4 ring-background shadow-2xl border border-primary/20">
                  {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
                  <AvatarFallback className="text-5xl font-bold bg-primary/10 text-primary">
                    {initials(author.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <Text variant="h1" as="h1" className="tracking-tight">{author.name}</Text>
                      <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[10px] tracking-widest h-6 px-2.5">
                        <BadgeCheck className="h-3.5 w-3.5" /> {roleBadge}
                      </Badge>
                    </div>
                    <Text variant="h4" className="text-primary font-bold uppercase tracking-widest text-sm">
                      {author.title} · Imperialpedia
                    </Text>
                  </div>

                  {author.bio && (
                    <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                      {author.bio}
                    </Text>
                  )}

                  <div className="flex flex-wrap items-center gap-8 pt-2">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold tracking-tighter">{articles.length}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                        Articles Published
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold tracking-tighter">{totalReadingMinutes.toLocaleString()}m</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                        Total Read Time
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {author.social.twitter && (
                      <Button variant="outline" size="icon" className="rounded-full" asChild>
                        <a href={author.social.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {author.social.linkedin && (
                      <Button variant="outline" size="icon" className="rounded-full" asChild>
                        <a href={author.social.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {author.social.website && (
                      <Button variant="outline" size="icon" className="rounded-full" asChild>
                        <a href={author.social.website} target="_blank" rel="noopener noreferrer" title="Website">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {author.videoUrl && (
                      <Button variant="outline" className="rounded-full gap-2" asChild>
                        <a href={author.videoUrl} target="_blank" rel="noopener noreferrer">
                          <PlayCircle className="h-4 w-4" /> Watch Intro
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
            <div>
              <Text variant="label" className="text-primary mb-2 flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5" /> Full Archive
              </Text>
              <Text variant="h2">Latest From {author.name.split(' ')[0]}</Text>
            </div>
            <Text variant="bodySmall" className="text-muted-foreground font-semibold">
              {articles.length} articles
            </Text>
          </header>

          <ArticleList articles={articles} />
        </Container>
      </Section>
    </main>
  );
}
