import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Linkedin, Twitter, Facebook, Instagram, Mail, Rss, Home, ChevronRight } from 'lucide-react';
import { authorNameToSlug, getAllAuthors, isEditorRole } from '@/data/authors';
import { credentialStatus, credentialNotice } from '@/lib/author-credentials';
import { getMergedAuthorBySlug } from '@/lib/authors-server';
import { mergeArticles, type LawArticle } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { resolveArticleImage, resolvePersonImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
function isKeptCategoryArticle(a: { category?: { slug?: string } }): boolean {
  const rawSlug = a.category?.slug;
  return !rawSlug || currentSlugSet.has(toNewCategorySlug(rawSlug));
}

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllAuthors().map((a) => ({ slug: a.slug }));
}

/** Generate initials from a name, e.g. "Elena Rossi" → "ER" */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Format a date string to "Month DD, YYYY" */
function formatDate(d: string | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function AuthorProfilePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [author, cmsArticles] = await Promise.all([
    getMergedAuthorBySlug(slug),
    cmsGetArticles().catch(() => []),
  ]);
  if (!author) notFound();

  const articles: LawArticle[] = mergeArticles(cmsArticles)
    .filter((a) => authorNameToSlug(a.author) === author.slug && isKeptCategoryArticle(a))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const initials = getInitials(author.name);
  const firstName = author.name.split(' ')[0].toUpperCase();
  const bioParagraphs = author.bio.split('\n').map((p) => p.trim()).filter(Boolean);

  const credStatus = credentialStatus(author);

  const metaRows: { label: string; value: string }[] = [
    author.title && { label: 'TITLE', value: author.title },
    author.credentials && { label: credStatus === 'supplied' ? 'CREDENTIALS (AS SUPPLIED, NOT VERIFIED)' : 'AFFILIATION', value: author.credentials },
    author.education?.length && { label: 'EDUCATION', value: author.education.join(', ') },
    author.certifications?.length && { label: 'CERTIFICATIONS', value: author.certifications.join(', ') },
    author.expertise.length > 0 && { label: 'EXPERTISE', value: author.expertise.join(', ') },
  ].filter(Boolean) as { label: string; value: string }[];

  // Social icon configs — all displayed as round icon buttons
  const socialButtons = [
    author.social?.linkedin && {
      href: author.social.linkedin,
      label: 'LinkedIn',
      Icon: Linkedin,
      title: `${author.name} on LinkedIn`,
      external: true,
    },
    author.social?.x && {
      href: author.social.x,
      label: 'X / Twitter',
      Icon: Twitter,
      title: `${author.name} on X`,
      external: true,
    },
    author.social?.facebook && {
      href: author.social.facebook,
      label: 'Facebook',
      Icon: Facebook,
      title: `${author.name} on Facebook`,
      external: true,
    },
    author.social?.instagram && {
      href: author.social.instagram,
      label: 'Instagram',
      Icon: Instagram,
      title: `${author.name} on Instagram`,
      external: true,
    },
    // Email — links to contact page with author pre-filled in subject
    {
      href: `/contact-us?subject=Attention%3A%20${encodeURIComponent(author.name)}`,
      label: 'Contact',
      Icon: Mail,
      title: `Contact ${author.name}`,
      external: false,
    },
    // RSS feed
    {
      href: `/author/${slug}/feed.xml`,
      label: 'RSS Feed',
      Icon: Rss,
      title: `RSS feed — ${author.name}`,
      external: false,
    },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Linkedin; title: string; external: boolean }[];

  return (
    <div className="min-h-screen bg-[#f9f9fb]">
      <Navbar />

      <main className="pt-14 pb-20">

        {/* ─── HERO HEADER (navy bg + red bottom border) ─── */}
        <div className="w-full bg-[#0F2440] text-white border-b-[6px] border-[#E13131] shadow-xl">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">

            {/* Breadcrumb */}
            <div className="pt-6">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm pb-2 text-slate-300">
                <Link href="/" className="flex items-center gap-1.5 font-semibold hover:text-white transition-colors">
                  <Home className="h-3.5 w-3.5" />
                  Home
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <Link href="/authors" className="font-semibold hover:text-white transition-colors text-[#C8A24A]">
                  Authors
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="font-bold text-white truncate max-w-[200px] sm:max-w-sm" aria-current="page">
                  {author.name}
                </span>
              </nav>
            </div>

            {/* Author hero row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-10 lg:py-12">

              {/* Avatar — initials circle with gold bg */}
              <span className="relative flex overflow-hidden h-32 w-32 sm:h-36 sm:w-36 shrink-0 rounded-full border-4 border-white shadow-xl">
                <span className="flex h-full w-full items-center justify-center rounded-full text-3xl font-black bg-[#C8A24A] text-[#0F2440]">
                  {initials}
                </span>
              </span>

              <div className="space-y-2">
                {/* Site badge */}
                <div className="flex items-center gap-2">
                  <span className="bg-[#E13131] text-white text-xs font-black uppercase tracking-tighter px-3 py-1 -skew-x-12 inline-block shadow-sm">
                    LAW ELITE NETWORK AUTHOR
                  </span>
                </div>

                {/* Name */}
                <h1 className="text-4xl sm:text-5xl font-black text-white font-serif uppercase tracking-tighter leading-none">
                  {author.name}
                </h1>

                {/* Title — gold mono */}
                {author.title && (
                  <p className="text-sm font-mono font-bold uppercase tracking-wider text-[#C8A24A]">
                    {author.title}
                  </p>
                )}

                {/* Social / action buttons */}
                {socialButtons.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {socialButtons.map(({ href, label, Icon, title, external }) =>
                      external ? (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={title}
                          aria-label={title}
                          className="h-10 w-10 rounded-full bg-white text-[#0F2440] border-2 border-white hover:bg-[#E13131] hover:text-white hover:border-[#E13131] flex items-center justify-center transition-colors shadow-sm"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      ) : (
                        <Link
                          key={label}
                          href={href}
                          title={title}
                          aria-label={title}
                          className="h-10 w-10 rounded-full bg-white text-[#0F2440] border-2 border-white hover:bg-[#E13131] hover:text-white hover:border-[#E13131] flex items-center justify-center transition-colors shadow-sm"
                        >
                          <Icon className="h-4 w-4" />
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── DOSSIER CARD + ARTICLES ─── */}
        <section className="py-14">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">

            {/* Dossier card */}
            <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 pb-10 mb-14 relative rounded-sm">
              {/* Red top accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#E13131]" />

              <div className="px-6 sm:px-10 pt-8">
                {/* Dossier header */}
                <div className="flex items-center gap-2 border-b-2 border-black pb-3 pt-1">
                  <span className="bg-[#E13131] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
                    LAW ELITE DOSSIER
                  </span>
                  <h2 className="text-sm font-black uppercase tracking-widest text-black font-mono">
                    AUTHOR CREDENTIALS &amp; VERIFICATION
                  </h2>
                </div>

                {/* Meta rows */}
                {metaRows.length > 0 && (
                  <dl className="space-y-2 text-sm font-semibold mt-4">
                    {metaRows.map(({ label, value }) => (
                      <div key={label}>
                        <dt className="inline font-mono uppercase text-[#E13131] font-black">{label}: </dt>
                        <dd className="inline text-slate-900 font-bold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {/* Verification status: only what the data supports */}
                <div className="mt-5 border-2 border-black bg-slate-50 p-5 text-xs sm:text-sm font-bold text-slate-800 space-y-2">
                  <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#E13131]">
                    VERIFICATION STATUS
                  </p>
                  <p>Confirmed: {author.name} is a Law Elite Network {isEditorRole(author.title) ? 'editor' : 'contributor'}.</p>
                  <p>
                    {credentialNotice(credStatus)}
                  </p>
                  <p>Articles are general legal education, not legal advice.</p>
                </div>

                {/* Editorial highlights */}
                {articles.length > 0 && (
                  <div className="mt-5 bg-slate-50 p-5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#E13131] mb-2">
                      EDITORIAL HIGHLIGHTS
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm font-bold text-black">
                      <li className="flex items-start gap-2">
                        <span className="text-[#E13131] font-mono font-black">01.</span>
                        <span>Has published {articles.length} article{articles.length !== 1 ? 's' : ''} on Law Elite Network.</span>
                      </li>
                      {author.expertise.length > 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-[#E13131] font-mono font-black">02.</span>
                          <span>Covers: {author.expertise.slice(0, 3).join(', ')}{author.expertise.length > 3 ? ' and more.' : '.'}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Bio */}
                <div className="space-y-3 pt-6">
                  <h3 className="text-xl font-black uppercase font-serif text-black border-b border-slate-200 pb-2">
                    BIOGRAPHY &amp; EXPERIENCE
                  </h3>
                  {bioParagraphs.map((p, i) => (
                    <p key={i} className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Education */}
                {author.education && author.education.length > 0 && (
                  <div className="space-y-3 pt-6">
                    <h3 className="text-xl font-black uppercase font-serif text-black border-b border-slate-200 pb-2">
                      EDUCATION
                    </h3>
                    <ul className="space-y-1.5">
                      {author.education.map((e) => (
                        <li key={e} className="flex items-start gap-2 text-sm font-bold text-slate-800">
                          <span className="text-[#E13131] font-mono font-black mt-0.5">→</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Editorial integrity */}
                <div className="space-y-3 pt-6">
                  <h3 className="text-xl font-black uppercase font-serif text-black border-b border-slate-200 pb-2">
                    EDITORIAL INTEGRITY
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                    Law Elite Network publishes plain-language legal guides for a worldwide audience. Every article names its author.
                    Learn more in our{' '}
                    <Link href="/editorial-standards" className="text-[#E13131] hover:underline">
                      editorial standards →
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* ─── ARTICLES LIST ─── */}
            <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b-4 border-black pb-4">
              <div className="flex items-center gap-3">
                <span className="bg-[#E13131] text-white text-xs font-black uppercase tracking-widest px-3 py-1 -skew-x-12">
                  LAW ELITE ARCHIVE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-black uppercase font-serif">
                  LATEST ARTICLES BY {firstName}
                </h2>
              </div>
              {articles.length > 0 && (
                <span className="bg-black text-white text-xs font-mono font-bold px-3 py-1 uppercase">
                  {articles.length} ARTICLE{articles.length !== 1 ? 'S' : ''} PUBLISHED
                </span>
              )}
            </header>

            {articles.length === 0 ? (
              <p className="text-slate-500 italic font-medium py-8">No published guides yet.</p>
            ) : (
              <div className="divide-y-2 divide-slate-200">
                {articles.map((art) => (
                  <article key={art.id} className="py-6 first:pt-0 group">
                    <Link
                      href={articleUrl(art)}
                      className="flex flex-row gap-4 sm:gap-6 items-start"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 h-24 sm:w-[220px] sm:h-[147px] shrink-0 overflow-hidden bg-slate-200 border-2 border-black">
                        <Image
                          src={resolveArticleImage(art)}
                          alt={art.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(min-width: 640px) 220px, 96px"
                          data-ai-hint="legal article"
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {art.category?.name && (
                          <span className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-widest text-[#E13131]">
                            {art.category.name}
                          </span>
                        )}
                        <h3 className="mt-1 text-base sm:text-xl font-black text-slate-950 leading-snug font-serif group-hover:text-[#E13131] transition-colors line-clamp-2 sm:line-clamp-none">
                          {art.title}
                        </h3>
                        <span className="block mt-1.5 text-[11px] font-mono font-bold uppercase tracking-wide text-slate-500">
                          {formatDate(art.updatedAt)}
                        </span>
                        {(art.summary || (art as any).excerpt) && (
                          <p className="hidden sm:block mt-2 text-sm text-slate-700 leading-relaxed line-clamp-2">
                            {art.summary || (art as any).excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}

          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
