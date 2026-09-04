import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Linkedin, Twitter, Facebook, Instagram, BookOpen } from 'lucide-react';
import { authorNameToSlug, getAllAuthors } from '@/data/authors';
import { getMergedAuthorBySlug } from '@/lib/authors-server';
import { mergeArticles, type LawArticle } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { resolveArticleImage, resolvePersonImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

// AdSense-readiness retirement (see category-slugs.ts's CURRENT_CATEGORY_SLUGS
// comment): an author's article list here is exactly the kind of surface the
// retirement plan calls out -- a retired-category guide must stop being
// linked from a live, indexed page even though it still resolves at
// /article/{slug} until the CMS-side archive runs. sitemap.ts's
// isKeptCategoryArticle mirrors this filter (see its own comment) so a
// contributor whose only work is retired doesn't get a sitemap entry for a
// page that would now show "No published guides yet".
const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
function isKeptCategoryArticle(a: { category?: { slug?: string } }): boolean {
  const rawSlug = a.category?.slug;
  return !rawSlug || currentSlugSet.has(toNewCategorySlug(rawSlug));
}

// Serve a cached page and refresh it in the background every 5 minutes,
// instead of re-rendering (and re-fetching from the CMS) on every single
// visitor/Googlebot request.
export const revalidate = 300;

// `revalidate` above only produces a cached HTML response for paths Next
// knows about ahead of time -- without this, a dynamic segment with no
// generateStaticParams renders fully per-request regardless of `revalidate`.
// The bundled authors are a small, known, local list, so prerendering them
// here is what actually makes this route ISR'd for them. CMS-only authors
// (not in this list) still render fine on demand via getMergedAuthorBySlug --
// dynamicParams stays true by default.
export function generateStaticParams() {
  return getAllAuthors().map((a) => ({ slug: a.slug }));
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

  // Match a byline ("Elena Rossi") to this profile by its normalized slug.
  // mergeArticles() folds in CMS-sourced guides (CMS wins by slug) so a
  // contributor whose work lives only in the CMS isn't shown as having
  // published nothing.
  const articles: LawArticle[] = mergeArticles(cmsArticles)
    .filter((a) => authorNameToSlug(a.author) === author.slug && isKeptCategoryArticle(a))
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0));

  const avatar = resolvePersonImage({ avatarUrl: author.avatarUrl, name: author.name, avatarSeed: author.avatarSeed });
  const bioParagraphs = author.bio.split('\n').map((p) => p.trim()).filter(Boolean);
  const firstName = author.name.split(' ')[0];

  // Bold-label meta rows, Investopedia-style ("Title:", "Education:", ...).
  // Each row only renders when real data backs it -- education/certifications
  // are CMS-managed and verified-only (see LawAuthor doc comment), never
  // inferred, so most profiles simply won't show those rows yet.
  const metaRows: { label: string; value: string }[] = [
    author.title && { label: 'Title', value: author.title },
    author.credentials && { label: 'Affiliation', value: author.credentials },
    author.education?.length && { label: 'Education', value: author.education.join(', ') },
    author.certifications?.length && { label: 'Certifications', value: author.certifications.join(', ') },
    author.expertise.length > 0 && { label: 'Expertise', value: author.expertise.join(', ') },
  ].filter(Boolean) as { label: string; value: string }[];

  const socialLinks = [
    author.social?.linkedin && { href: author.social.linkedin, label: 'LinkedIn', Icon: Linkedin },
    author.social?.x && { href: author.social.x, label: 'X', Icon: Twitter },
    author.social?.facebook && { href: author.social.facebook, label: 'Facebook', Icon: Facebook },
    author.social?.instagram && { href: author.social.instagram, label: 'Instagram', Icon: Instagram },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Linkedin }[];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-20 pb-24">
        <div className="container mx-auto px-6 max-w-5xl pt-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-slate-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/authors" className="hover:text-slate-700">Contributors</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">{author.name}</span>
          </nav>
        </div>

        {/* Banner */}
        <div className="bg-blue-50 border-y border-blue-100">
          <div className="container mx-auto px-6 max-w-5xl py-10 md:py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden bg-slate-200 shadow-sm">
                <Image src={avatar} alt={author.name} fill className="object-cover grayscale" data-ai-hint="professional portrait" />
              </div>
              <div>
                <h1 className="text-3xl md:text-[44px] font-bold text-slate-900 tracking-tight font-serif leading-tight">
                  {author.name}
                </h1>
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    {socialLinks.map(({ href, label, Icon }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${author.name} on ${label}`}
                        className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 max-w-5xl pt-10">

          {metaRows.length > 0 && (
            <dl className="space-y-2 mb-12 text-[15px] leading-relaxed">
              {metaRows.map(({ label, value }) => (
                <div key={label}>
                  <dt className="inline font-bold text-slate-900">{label}: </dt>
                  <dd className="inline text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <section className="max-w-3xl mb-14">
            <h2 className="text-2xl font-bold text-slate-900 font-serif mb-4">Experience</h2>
            <div className="space-y-5 text-[18px] leading-[1.7] text-slate-700 font-serif">
              {bioParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {author.education && author.education.length > 0 && (
            <section className="max-w-3xl mb-14">
              <h2 className="text-2xl font-bold text-slate-900 font-serif mb-4">Education</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-[16px] leading-relaxed text-slate-700">
                {author.education.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="max-w-3xl mb-16 pt-8 border-t border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 font-serif mb-4">About Law Elite Network</h2>
            <p className="text-[15px] leading-relaxed text-slate-600">
              Law Elite Network is a legal knowledge platform that publishes clear, well-sourced legal explainers for a
              worldwide audience and operates a directory through which readers can discover qualified practitioners.
              Every profile is created for editorial attribution and is subject to our{' '}
              <Link href="/editorial-standards" className="text-blue-600 hover:underline">editorial standards</Link>. Learn
              more in our{' '}
              <Link href="/about-us" className="text-blue-600 hover:underline">About Us</Link> page.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-10 pt-4 border-t-4 border-blue-600">
              <BookOpen className="w-6 h-6 text-blue-600 mt-4" />
              <h2 className="text-3xl font-bold text-slate-900 pt-4">
                Latest from {firstName}{' '}
                {articles.length > 0 && <span className="text-slate-400 font-medium text-xl">({articles.length})</span>}
              </h2>
            </div>

            {articles.length === 0 ? (
              <p className="text-slate-500 italic">No published guides yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {articles.map((art) => (
                  <Link key={art.id} href={articleUrl(art)} className="group block h-full">
                    <div className="bg-white border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col h-full">
                      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                        <Image
                          src={resolveArticleImage(art)}
                          alt={art.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          data-ai-hint="legal dossier"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight mb-2">
                          {art.category?.name ?? 'Legal Guide'}
                        </span>
                        <h3 className="text-[17px] font-bold text-slate-900 leading-[1.3] group-hover:text-blue-700 transition-colors line-clamp-3">
                          {art.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
