import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { Twitter, Linkedin, Globe, Facebook, Instagram, PlayCircle, Newspaper } from 'lucide-react';

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
  const profileUrl = `${env.siteUrl}/authors/${author.slug}`;
  const sameAs = [
    author.social.twitter,
    author.social.linkedin,
    author.social.website,
    author.social.facebook,
    author.social.instagram,
  ].filter((v): v is string => Boolean(v));
  const personSchema = structuredData.person({
    name: author.name,
    jobTitle: author.title,
    description: author.bio,
    url: profileUrl,
    image: author.avatarUrl,
    sameAs: sameAs.length ? sameAs : undefined,
    alumniOf: author.education,
    knowsAbout: author.expertise,
  });
  const breadcrumb = breadcrumbService.generateBreadcrumbForAuthor(author.name, author.slug);
  const firstName = author.name.split(' ')[0];

  // "a bachelor's" / "a bachelor's and a master's" / "a bachelor's, a master's, and a PhD"
  const joinNatural = (items: string[]) =>
    items.length <= 1
      ? (items[0] ?? '')
      : items.length === 2
        ? items.join(' and ')
        : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;

  // Short highlight bullets built only from fields this author actually has on
  // record — never invented tenure/stats, per the site's real-data-only policy.
  const highlights: string[] = [];
  if (articles.length > 0) {
    highlights.push(`Has published ${articles.length} article${articles.length === 1 ? '' : 's'} for Imperialpedia.`);
  }
  if (author.education?.length) {
    highlights.push(`Holds ${joinNatural(author.education)}.`);
  }
  if (author.certifications?.length) {
    highlights.push(`Certified in ${joinNatural(author.certifications)}.`);
  }
  if (author.expertise?.length) {
    highlights.push(`Covers ${author.expertise.slice(0, 6).join(', ')} for Imperialpedia.`);
  }
  if (author.credentials) {
    highlights.push(author.credentials);
  }

  return (
    <main className="min-h-screen bg-background pt-16">
      <JsonLd data={personSchema} />

      <div className="w-full bg-primary/10 border-b border-primary/15">
        <Container>
          <div className="pt-6">
            <Breadcrumbs breadcrumb={breadcrumb} className="mb-0" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-10 lg:py-12">
            <Avatar className="h-32 w-32 sm:h-36 sm:w-36 shrink-0 rounded-md grayscale">
              {author.avatarUrl && (
                <AvatarImage src={author.avatarUrl} alt={author.name} className="rounded-md" />
              )}
              <AvatarFallback className="rounded-md text-3xl font-bold bg-primary/10 text-primary">
                {initials(author.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <Text variant="h1" as="h1" className="tracking-tight">
                {author.name}
              </Text>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {author.social.linkedin && (
                  <Button variant="outline" size="icon" className="rounded-full bg-background" asChild>
                    <a href={author.social.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.social.twitter && (
                  <Button variant="outline" size="icon" className="rounded-full bg-background" asChild>
                    <a href={author.social.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.social.website && (
                  <Button variant="outline" size="icon" className="rounded-full bg-background" asChild>
                    <a href={author.social.website} target="_blank" rel="noopener noreferrer" title="Website">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.social.facebook && (
                  <Button variant="outline" size="icon" className="rounded-full bg-background" asChild>
                    <a href={author.social.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.social.instagram && (
                  <Button variant="outline" size="icon" className="rounded-full bg-background" asChild>
                    <a href={author.social.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.videoUrl && (
                  <Button variant="outline" size="icon" className="rounded-full bg-background" asChild>
                    <a href={author.videoUrl} target="_blank" rel="noopener noreferrer" title="Watch intro">
                      <PlayCircle className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Section spacing="md">
        <Container>
          <div className="max-w-2xl space-y-6 pb-14 mb-14 border-b border-border">
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="inline font-bold text-foreground">Title: </dt>
                <dd className="inline text-muted-foreground">{author.title}</dd>
              </div>
              {author.education?.length ? (
                <div>
                  <dt className="inline font-bold text-foreground">Education: </dt>
                  <dd className="inline text-muted-foreground">{author.education.join(' · ')}</dd>
                </div>
              ) : null}
              {author.expertise?.length ? (
                <div>
                  <dt className="inline font-bold text-foreground">Expertise: </dt>
                  <dd className="inline text-muted-foreground">{author.expertise.join(', ')}</dd>
                </div>
              ) : null}
            </dl>

            {highlights.length > 0 && (
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                {highlights.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}

            {author.bio && (
              <div className="space-y-3 pt-2">
                <Text variant="h4" as="h2" className="font-bold">
                  Experience
                </Text>
                <Text variant="body" className="text-muted-foreground leading-relaxed">
                  {author.bio}
                </Text>
              </div>
            )}

            {author.education?.length ? (
              <div className="space-y-3">
                <Text variant="h4" as="h2" className="font-bold">
                  Education
                </Text>
                <Text variant="body" className="text-muted-foreground leading-relaxed">
                  {firstName} holds {joinNatural(author.education)}.
                </Text>
              </div>
            ) : null}

            <div className="space-y-3">
              <Text variant="h4" as="h2" className="font-bold">
                About Imperialpedia
              </Text>
              <Text variant="body" className="text-muted-foreground leading-relaxed">
                Imperialpedia helps readers understand personal finance, investing, and markets.
                Every published article names a writer, an editorial reviewer, and a fact-checker,
                and claims are checked against primary sources before publication. Learn more in
                our{' '}
                <Link href="/editorial-policy" className="text-primary hover:underline">
                  editorial policy
                </Link>{' '}
                and{' '}
                <Link href="/fact-checking" className="text-primary hover:underline">
                  fact-checking policy
                </Link>
                .
              </Text>
            </div>
          </div>

          <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
            <div>
              <Text variant="label" className="text-primary mb-2 flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5" /> Full Archive
              </Text>
              <Text variant="h2">Latest From {firstName}</Text>
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
