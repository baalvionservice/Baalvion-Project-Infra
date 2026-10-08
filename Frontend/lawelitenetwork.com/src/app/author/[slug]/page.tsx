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
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';
import { resolveArticleImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';
import { formatArticleDate } from '@/lib/format-date';
import { AdSlot } from '@/components/ads/AdSlot';

const AUTHOR_AD_SLOT_ID = '4123514154';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lawelitenetwork.com';

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

  const topics = Array.from(
    new Map(
      articles
        .filter((a) => a.category?.slug && a.category?.name)
        .map((a) => [toNewCategorySlug(a.category!.slug as string), a.category!.name as string]),
    ).entries(),
  );
  const initials = getInitials(author.name);
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

  const roleLabel = isEditorRole(author.title) ? 'Editor' : 'Contributor';
  const [latest, ...archive] = articles;
  const desk = author.title;

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-slate-900">
      <Navbar />

      <main className="pt-14 pb-24">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="pt-6 text-[13px] text-slate-500">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link href="/authors" className="hover:text-slate-900">Authors</Link>
          </nav>

          {/* masthead */}
          <header className="mt-8 border-t-[5px] border-[#0F2440] pt-5">
            <div className={author.avatarUrl ? 'grid grid-cols-1 items-end gap-8 md:grid-cols-[1fr_15rem]' : ''}>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#E13131]">
                  {roleLabel}
                  {desk && <span className="text-slate-400"> &nbsp;·&nbsp; </span>}
                  <span className="text-slate-500">{desk}</span>
                </p>
                <h1 className="mt-4 break-words font-serif text-[2.9rem] font-black leading-[0.95] tracking-tight text-[#0F2440] sm:text-7xl lg:text-[5.5rem]">
                  {author.name}
                </h1>
              </div>
              {author.avatarUrl && (
                <div className="relative order-first aspect-[4/5] w-44 overflow-hidden bg-slate-200 md:order-none md:w-full">
                  <Image
                    src={author.avatarUrl}
                    alt={`Portrait of ${author.name}`}
                    fill
                    priority
                    sizes="(min-width: 768px) 240px, 176px"
                    className="object-cover grayscale"
                  />
                </div>
              )}
            </div>
            <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-y border-slate-300 py-3 text-[13px] text-slate-600">
              <p className="font-serif italic">
                {articles.length === 0
                  ? 'No pieces published yet'
                  : `${articles.length} ${articles.length === 1 ? 'piece' : 'pieces'} on Law Elite Network` +
                    (latest ? `, most recently ${formatArticleDate(latest.updatedAt)}` : '')}
              </p>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 font-medium">
                {socialButtons.map(({ href, label, title, external }) => (
                  <li key={label}>
                    {external ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" title={title} className="underline decoration-slate-300 underline-offset-4 hover:text-[#E13131] hover:decoration-[#E13131]">
                        {label} ↗
                      </a>
                    ) : (
                      <Link href={href} title={title} className="underline decoration-slate-300 underline-offset-4 hover:text-[#E13131] hover:decoration-[#E13131]">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-12">
            {/* bio */}
            <section aria-label={`About ${author.name}`} className="lg:col-span-7 lg:col-start-1">
              <div className="space-y-5 font-serif text-[1.15rem] leading-[1.8] text-slate-800 first-letter:float-left first-letter:-mr-0.5 first-letter:mt-1 first-letter:text-[4.2rem] first-letter:font-black first-letter:leading-[0.8] first-letter:text-[#0F2440]">
                {bioParagraphs.map((p, i) => (
                  <p key={i} className={i === 0 ? '' : 'first-letter:float-none first-letter:text-[inherit] first-letter:font-normal first-letter:mr-0 first-letter:mt-0 first-letter:leading-[inherit]'}>
                    {p}
                  </p>
                ))}
              </div>
            </section>

            {/* margin notes */}
            <aside className="lg:col-span-4 lg:col-start-9">
              <dl className="divide-y divide-slate-300 border-y border-slate-300 text-[14px]">
                {metaRows.filter((r) => r.label !== 'TITLE').map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
                    <dd className="font-medium leading-snug text-slate-900">{value}</dd>
                  </div>
                ))}
                {author.education && author.education.length > 0 && (
                  <div className="grid grid-cols-[7.5rem_1fr] gap-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Education</dt>
                    <dd className="font-medium leading-snug text-slate-900">{author.education.join('; ')}</dd>
                  </div>
                )}
                {topics.length > 0 && (
                  <div className="grid grid-cols-[7.5rem_1fr] gap-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Writes in</dt>
                    <dd className="font-medium leading-snug">
                      {topics.map(([topicSlug, name], i) => (
                        <React.Fragment key={topicSlug}>
                          {i > 0 && <span className="text-slate-400">, </span>}
                          <Link href={`/${topicSlug}`} className="underline decoration-slate-300 underline-offset-4 hover:text-[#E13131] hover:decoration-[#E13131]">
                            {name}
                          </Link>
                        </React.Fragment>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 font-serif text-[13px] italic leading-relaxed text-slate-500">
                {credentialNotice(credStatus)} Articles are general education, not legal advice.{' '}
                <Link href="/editorial-standards" className="not-italic underline decoration-slate-300 underline-offset-4 hover:text-[#E13131]">
                  Editorial standards
                </Link>
              </p>
            </aside>
          </div>

          {/* the work */}
          <section aria-label={`Articles by ${author.name}`} className="mt-20">
            <h2 className="flex items-baseline gap-4 border-b-2 border-[#0F2440] pb-2 font-serif text-2xl font-black text-[#0F2440]">
              The work
              {articles.length > 0 && <span className="text-sm font-normal italic text-slate-500">{articles.length} in all</span>}
            </h2>

            {articles.length === 0 && <p className="py-10 font-serif italic text-slate-500">No published guides yet.</p>}

            {latest && (
              <Link href={articleUrl(latest)} className="group mt-8 grid grid-cols-1 gap-6 border-b border-slate-300 pb-10 md:grid-cols-12 md:gap-10">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 md:col-span-6">
                  <Image
                    src={resolveArticleImage(latest)}
                    alt={latest.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-col justify-center md:col-span-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E13131]">
                    {latest.category?.name} <span className="text-slate-400">· {formatArticleDate(latest.updatedAt)}</span>
                  </p>
                  <h3 className="mt-3 font-serif text-3xl font-black leading-tight text-[#0F2440] group-hover:underline decoration-[#E13131] decoration-2 underline-offset-4 sm:text-4xl">
                    {latest.title}
                  </h3>
                  {(latest.summary || (latest as any).excerpt) && (
                    <p className="mt-4 font-serif text-[1.05rem] leading-relaxed text-slate-700 line-clamp-4">
                      {latest.summary || (latest as any).excerpt}
                    </p>
                  )}
                </div>
              </Link>
            )}

            {archive.length > 0 && (
              <ol className="divide-y divide-slate-300">
                {archive.map((art) => (
                  <li key={art.id}>
                    <Link href={articleUrl(art)} className="group grid grid-cols-1 gap-1 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
                      <time className="pt-1 text-[12px] font-medium uppercase tracking-wider text-slate-500">
                        {formatArticleDate(art.updatedAt)}
                      </time>
                      <div>
                        {art.category?.name && (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E13131]">{art.category.name}</p>
                        )}
                        <h3 className="mt-1 font-serif text-xl font-bold leading-snug text-slate-900 group-hover:underline decoration-[#E13131] decoration-2 underline-offset-4 sm:text-2xl">
                          {art.title}
                        </h3>
                        {(art.summary || (art as any).excerpt) && (
                          <p className="mt-2 max-w-2xl font-serif text-[1rem] leading-relaxed text-slate-600 line-clamp-2">
                            {art.summary || (art as any).excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="mt-12">
            <AdSlot slotId={AUTHOR_AD_SLOT_ID} format="horizontal" placement="author-mid-page" fullWidthResponsive minHeight="100px" />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
