import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
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
    title: `${author.name} — Imperialpedia Author Profile`,
    description: author.bio,
    ogImage: author.avatarUrl,
    ogType: 'profile',
    canonical: `/authors/${author.slug}`,
  });
}

/**
 * Imperialpedia Tabloid Style Individual Author Profile Page
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

  const joinNatural = (items: string[]) =>
    items.length <= 1
      ? (items[0] ?? '')
      : items.length === 2
        ? items.join(' and ')
        : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;

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
    <main className="min-h-screen bg-[#f9f9fb] dark:bg-black pt-12 pb-20">
      <JsonLd data={personSchema} />

      {/* ── Imperialpedia Heavy Header Banner ── */}
      <div className="w-full bg-black text-white border-b-6 border-[#c8102e] shadow-xl">
        <Container>
          <div className="pt-6">
            <Breadcrumbs breadcrumb={breadcrumb} className="mb-0 text-slate-300" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-10 lg:py-12">
            <Avatar className="h-32 w-32 sm:h-36 sm:w-36 shrink-0 rounded-full border-4 border-white shadow-xl">
              {author.avatarUrl && (
                <AvatarImage src={author.avatarUrl} alt={author.name} className="object-cover" />
              )}
              <AvatarFallback className="text-3xl font-black bg-[#c8102e] text-white">
                {initials(author.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#c8102e] text-white text-xs font-black uppercase tracking-tighter px-3 py-1 -skew-x-12 inline-block shadow-sm">
                  IMPERIALPEDIA AUTHOR
                </span>
                <span className="bg-[#ffcc00] text-black text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5">
                  VERIFIED ANALYST
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black text-white font-serif uppercase tracking-tighter">
                {author.name}
              </h1>

              <p className="text-sm font-mono font-bold uppercase tracking-wider text-[#ffcc00]">
                {author.title}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {author.social.linkedin && (
                  <Button variant="outline" size="icon" className="rounded-full bg-white text-black hover:bg-[#c8102e] hover:text-white border-2 border-black" asChild>
                    <a href={author.social.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.social.twitter && (
                  <Button variant="outline" size="icon" className="rounded-full bg-white text-black hover:bg-[#c8102e] hover:text-white border-2 border-black" asChild>
                    <a href={author.social.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.social.website && (
                  <Button variant="outline" size="icon" className="rounded-full bg-white text-black hover:bg-[#c8102e] hover:text-white border-2 border-black" asChild>
                    <a href={author.social.website} target="_blank" rel="noopener noreferrer" title="Website">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.social.facebook && (
                  <Button variant="outline" size="icon" className="rounded-full bg-white text-black hover:bg-[#c8102e] hover:text-white border-2 border-black" asChild>
                    <a href={author.social.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.social.instagram && (
                  <Button variant="outline" size="icon" className="rounded-full bg-white text-black hover:bg-[#c8102e] hover:text-white border-2 border-black" asChild>
                    <a href={author.social.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {author.videoUrl && (
                  <Button variant="outline" size="icon" className="rounded-full bg-white text-black hover:bg-[#c8102e] hover:text-white border-2 border-black" asChild>
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
          {/* ── Imperialpedia Profile Details Box ── */}
          <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(200,16,46,0.3)] space-y-6 pb-10 mb-14 relative rounded-xs">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
            
            <div className="flex items-center gap-2 border-b-2 border-black dark:border-slate-800 pb-3 pt-1">
              <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
                IMPERIALPEDIA DOSSIER
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-black dark:text-white font-mono">
                AUTHOR CREDENTIALS &amp; VERIFICATION
              </h2>
            </div>

            <dl className="space-y-2 text-sm font-semibold">
              <div>
                <dt className="inline font-mono uppercase text-[#c8102e] font-black">TITLE: </dt>
                <dd className="inline text-slate-900 dark:text-slate-100 font-bold">{author.title}</dd>
              </div>
              {author.education?.length ? (
                <div>
                  <dt className="inline font-mono uppercase text-[#c8102e] font-black">EDUCATION: </dt>
                  <dd className="inline text-slate-900 dark:text-slate-100 font-bold">{author.education.join(' · ')}</dd>
                </div>
              ) : null}
              {author.expertise?.length ? (
                <div>
                  <dt className="inline font-mono uppercase text-[#c8102e] font-black">EXPERTISE: </dt>
                  <dd className="inline text-slate-900 dark:text-slate-100 font-bold">{author.expertise.join(', ')}</dd>
                </div>
              ) : null}
            </dl>

            {highlights.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 p-5 border-2 border-black dark:border-slate-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#c8102e] mb-2">
                  EDITORIAL HIGHLIGHTS
                </p>
                <ul className="space-y-2 text-xs sm:text-sm font-bold text-black dark:text-slate-100">
                  {highlights.map((point, i) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="text-[#c8102e] font-mono font-black">0{i + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {author.bio && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xl font-black uppercase font-serif text-black dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  BIOGRAPHY &amp; EXPERIENCE
                </h3>
                <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {author.bio}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h3 className="text-xl font-black uppercase font-serif text-black dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                EDITORIAL INTEGRITY
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                Imperialpedia helps readers understand personal finance, investing, and markets.
                Every published article names a writer, an editorial reviewer, and a fact-checker,
                and claims are checked against primary sources before publication. Learn more in
                our{' '}
                <Link href="/editorial-policy" className="text-[#c8102e] font-black hover:underline">
                  editorial policy →
                </Link>
              </p>
            </div>
          </div>

          {/* ── Articles Archive Header ── */}
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b-4 border-black dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#c8102e] text-white text-xs font-black uppercase tracking-widest px-3 py-1 -skew-x-12">
                IMPERIALPEDIA ARCHIVE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white uppercase font-serif">
                LATEST ARTICLES BY {firstName.toUpperCase()}
              </h2>
            </div>
            <span className="bg-black text-white text-xs font-mono font-bold px-3 py-1 uppercase">
              {articles.length} ARTICLES PUBLISHED
            </span>
          </header>

          <ArticleList articles={articles} />
        </Container>
      </Section>
    </main>
  );
}
