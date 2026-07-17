import { newsArticles, NewsBodyBlock, NewsArticle } from "@/lib/data.news";
import { getPublishedNewsBySlug } from "@/services/data/cms-public";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/services/format-date";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { brokerGuides } from "../brokers/Components/data.brokers";
import { ArticleCard, CategoryBadge } from "../news/NewsArticleCard";
import { ReviewLayout } from "@/components/layout/ReviewLayout";
import { fetchReviewBySlug } from "@/lib/data/review-live";
import { getTermUrl } from "@/lib/data/utils";
import { fetchTermsByLetter } from "@/lib/data/term-live";
import { Term } from "@/lib/data/terms";
import { staticArticleBySlug, staticNewsBySlug } from "@/services/data/static-content";
import Link from "next/link";
import { env } from "@/config/env";
import { articleUrl } from "@/lib/data/article-url";
import { ShareBar } from "@/components/article/ShareBar";
import { articlesService } from "@/services/data";
import {
  resolveArticleForDetail,
  buildArticleDetailMetadata,
  ArticleDetailContent,
} from "@/modules/content-engine/render/article-detail";

type ArticleType = NewsArticle;

type SlugParams = { slug: string[] };

const YEAR_SEGMENT = /^\d{4}$/;
const TWO_DIGIT_SEGMENT = /^\d{2}$/;

/**
 * This route is a catch-all (`[...slug]`) instead of two sibling dynamic
 * folders because Next.js requires every dynamic segment at the same tree
 * position to share one param name — a bare `/slug` route and a dated
 * `/YYYY/MM/DD/slug` route can't coexist as separate `[slug]`/`[year]`
 * folders at the app root. Splitting on segment count below recovers the
 * same two routes from one catch-all.
 */
function isDatedSegments(segments: string[]): segments is [string, string, string, string] {
  return (
    segments.length === 4 &&
    YEAR_SEGMENT.test(segments[0]) &&
    TWO_DIGIT_SEGMENT.test(segments[1]) &&
    TWO_DIGIT_SEGMENT.test(segments[2])
  );
}

async function findNewsArticle(slug: string): Promise<NewsArticle | null> {
  return (
    newsArticles.find((a) => a.slug === slug) ??
    (await getPublishedNewsBySlug(slug)) ??
    staticNewsBySlug(slug) ??
    null
  );
}

function canonicalSegments(dateISO: string): { year: string; month: string; day: string } {
  const d = new Date(dateISO);
  return {
    year: String(d.getUTCFullYear()),
    month: String(d.getUTCMonth() + 1).padStart(2, "0"),
    day: String(d.getUTCDate()).padStart(2, "0"),
  };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<SlugParams> }) {
  const { slug: segments } = await params;

  if (isDatedSegments(segments)) {
    const [, , , articleSlug] = segments;
    const article = await findNewsArticle(articleSlug);
    if (!article) return {};
    return buildMetadata({
      title: article.title,
      description: article.excerpt,
      canonical: articleUrl(article.publishedAt, articleSlug),
      ogImage: article.imageUrl,
      ogType: "article",
    });
  }

  // Content-engine guides canonically live at /<categorySlug>/<slug> — a
  // 2-segment path that isn't a real nested route (Next.js always resolves a
  // more specific static/dynamic route first) falls through here.
  if (segments.length === 2) {
    const [, articleSlug] = segments;
    return buildArticleDetailMetadata(articleSlug);
  }

  if (segments.length !== 1) return {};
  const slug = segments[0];

  // Check if this is a terms-beginning-with pattern
  if (slug.startsWith("terms-beginning-with-")) {
    const letter = slug.replace("terms-beginning-with-", "");
    const terms: Term[] = await fetchTermsByLetter(letter);
    if (terms && terms.length > 0) {
      return buildMetadata({
        title: `Financial Terms Starting with "${letter.toUpperCase()}" | Imperial Finance Glossary`,
        description: `Explore our comprehensive glossary of financial terms starting with "${letter.toUpperCase()}". From A to Z, find clear definitions and expert insights on investment, economics, and market terminology to enhance your financial literacy.`,
        canonical: `/${slug}`,
        noIndex: false,
      });
    }
  }

  // Review pages get their own metadata (live from imperialpedia-service, static fallback)
  const review = await fetchReviewBySlug(slug);
  if (review) {
    return buildMetadata({
      title: review.title,
      description: review.metaDescription,
      canonical: `/${slug}`,
      noIndex: false,
    });
  }

  // Standard article metadata — static set first, then live CMS news, then the
  // committed snapshot (so real articles keep valid metadata when the CMS is offline).
  const article =
    newsArticles.find((a) => a.slug === slug) ??
    (await getPublishedNewsBySlug(slug)) ??
    staticNewsBySlug(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    // News content's canonical home is the dated CNBC-style URL — this bare
    // `/slug` route redirects there below; keep metadata pointed at the same
    // destination.
    canonical: articleUrl(article.publishedAt, slug),
    noIndex: false,
  });
}

// ─── Body block renderer (shared by both the bare-slug and dated routes) ─────

function BodyBlock({ block }: { block: NewsBodyBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-foreground text-[1.0625rem] leading-[1.85] mb-5">
          {block.text}
        </p>
      );

    case "heading":
      return (
        <h2 className="text-foreground text-2xl font-bold mt-10 mb-4 leading-snug">
          {block.text}
        </h2>
      );

    case "subheading":
      return (
        <h3 className="text-foreground text-lg font-semibold mt-7 mb-3 leading-snug">
          {block.text}
        </h3>
      );

    case "quote":
      return (
        <blockquote className="my-8 pl-6 border-l-4 border-foreground">
          <p className="text-foreground text-xl font-medium leading-relaxed italic mb-2">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.attribution && (
            <footer className="text-sm text-muted-foreground not-italic font-medium">
              — {block.attribution}
            </footer>
          )}
        </blockquote>
      );

    case "callout":
      return (
        <div className="my-7 rounded-xl bg-muted border border-border px-6 py-5">
          <p className="text-foreground text-[0.9375rem] leading-relaxed font-medium">
            {block.text}
          </p>
        </div>
      );

    case "list":
      return (
        <ul className="my-5 space-y-2 pl-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-foreground text-[1.0625rem] leading-relaxed"
            >
              <span className="mt-[0.4rem] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              {item}
            </li>
          ))}
        </ul>
      );

    case "image":
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={block.url}
              alt={block.caption ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-xs text-muted-foreground text-center leading-relaxed">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}

// At most one <h2> per article (SEO: single-H2 hierarchy) — the page's own H1 is
// the title, so the first "heading" block stays H2 and every later one demotes to
// "subheading" (renders H3) rather than repeating H2 for each major section.
function demoteExtraHeadings(body: NewsBodyBlock[]): NewsBodyBlock[] {
  let seenHeading = false;
  return body.map((block) => {
    if (block.type !== "heading") return block;
    if (!seenHeading) {
      seenHeading = true;
      return block;
    }
    return { ...block, type: "subheading" };
  });
}

// ─── Dated CNBC-style article page (/YYYY/MM/DD/slug) ────────────────────────

async function DatedArticlePage({ segments }: { segments: [string, string, string, string] }) {
  const [year, month, day, slug] = segments;
  const article = await findNewsArticle(slug);
  if (!article) notFound();

  const canonical = canonicalSegments(article.publishedAt);
  if (canonical.year !== year || canonical.month !== month || canonical.day !== day) {
    permanentRedirect(articleUrl(article.publishedAt, slug));
  }

  const relatedArticles = newsArticles
    .filter((a) => a.category === article.category && a.slug !== slug)
    .slice(0, 6);

  const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const canonicalPath = articleUrl(article.publishedAt, slug);
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || "",
    image: article.imageUrl ? [article.imageUrl] : [],
    author: { "@type": "Person", name: article.author?.name || "Imperialpedia" },
    publisher: { "@type": "Organization", name: "Imperialpedia", url: baseUrl },
    datePublished: article.publishedAt || "",
    dateModified: article.updatedAt || article.publishedAt || "",
    url: canonicalUrl,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "World", item: `${baseUrl}/world` },
      { "@type": "ListItem", position: 3, name: article.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="bg-white min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-10">
        <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Link href="/world" className="hover:text-[#CC0000]">World</Link>
          <span>/</span>
          <span className="text-gray-400">{article.category}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 xl:gap-14">
          {/* ══ LEFT: Article ══════════════════════════════════════════ */}
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={article.category} />
              {article.newsLabels?.map((label) => (
                <span
                  key={label}
                  className="inline-block w-fit text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-gray-900 text-white"
                >
                  {label}
                </span>
              ))}
            </div>

            <h1 className="text-foreground text-3xl md:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight mt-3">
              {article.title}
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed mt-4 max-w-2xl">{article.excerpt}</p>

            {article.keyTakeaways && article.keyTakeaways.length > 0 && (
              <div className="mt-6 border border-gray-200 bg-gray-50 rounded-sm p-5">
                <h3 className="text-xs font-black tracking-widest text-gray-900 uppercase mb-3">
                  Key Points
                </h3>
                <ul className="space-y-2">
                  {article.keyTakeaways.map((point, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#CC0000]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 py-5 mt-5 border-y border-gray-200">
              <div className="flex flex-col gap-1 text-sm">
                <span>
                  By <span className="font-semibold text-gray-900">{article.author.name}</span>
                  {article.author.title && (
                    <span className="text-gray-500"> · {article.author.title}</span>
                  )}
                </span>
                <span className="text-gray-500 text-xs">
                  Published {formatDateTime(article.publishedAt)}
                  {article.updatedAt && <> · Updated {formatDateTime(article.updatedAt)}</>}
                </span>
              </div>
              <ShareBar url={canonicalUrl} title={article.title} />
            </div>

            <figure className="mt-6 mb-8">
              <div className="relative w-full aspect-[16/9] overflow-hidden rounded-sm shadow-sm">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 720px"
                  priority
                />
              </div>
              {article.imageCaption && (
                <figcaption className="mt-2 text-xs text-gray-500 text-center">
                  {article.imageCaption}
                </figcaption>
              )}
            </figure>

            <div className="prose-none">
              {demoteExtraHeadings(article.body).map((block, i) => (
                <BodyBlock key={i} block={block} />
              ))}
            </div>

            {article.galleryImages && article.galleryImages.length > 0 && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {article.galleryImages.map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-sm">
                    <Image src={src} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 240px" />
                  </div>
                ))}
              </div>
            )}

            {article.externalSourceUrl && (
              <p className="mt-6 text-xs text-gray-500">
                Source:{" "}
                <a
                  href={article.externalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-700 hover:text-[#CC0000] underline underline-offset-2"
                >
                  {article.externalSourceName || article.externalSourceUrl}
                </a>
              </p>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          {/* ══ RIGHT: Sidebar ═══════════════════════════════════════════ */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-8">
            {relatedArticles.length > 0 && (
              <div>
                <h3 className="text-xs font-black tracking-widest text-gray-900 uppercase border-b-2 border-[#CC0000] pb-2 mb-4">
                  Related News
                </h3>
                <ul className="space-y-4">
                  {relatedArticles.map((a) => (
                    <li key={a.id}>
                      <Link href={articleUrl(a.publishedAt, a.slug)} className="group flex gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                          <Image src={a.imageUrl} alt={a.title} fill className="object-cover" sizes="64px" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-[#CC0000] transition-colors line-clamp-3">
                          {a.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {article.related && article.related.length > 0 && (
              <div>
                <h3 className="text-xs font-black tracking-widest text-gray-900 uppercase border-b-2 border-gray-200 pb-2 mb-4">
                  Read More
                </h3>
                <ul className="space-y-3">
                  {article.related.map((r) => (
                    <li key={r.label}>
                      <Link href={r.href} className="text-sm font-semibold text-gray-800 hover:text-[#CC0000] transition-colors leading-snug">
                        {r.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Bare-slug page (terms / reviews / stocks / brokers / news redirect) ─────

async function BareSlugPage({ slug }: { slug: string }) {
  // ── 1. Check if this is a terms-beginning-with pattern ──────────────────
  if (slug.startsWith("terms-beginning-with-")) {
    const letter = slug.replace("terms-beginning-with-", "");
    const terms = await fetchTermsByLetter(letter);

    if (!terms || terms.length === 0) {
      notFound();
    }

    return (
      <div className="min-h-48 mx-auto max-w-4xl p-4 mt-16">
        <h1 className="my-8 text-2xl md:text-4xl">
          Terms starting with "{letter.toUpperCase()}"
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {terms.map((term) => (
            <div key={term.slug}>
              <Link href={getTermUrl(term.slug)}>
                <h3 className="mb-2 uppercase hover:underline">
                  {term.seoTitle}
                </h3>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 2. Check review guides (live from imperialpedia-service, static fallback) ──
  const review = await fetchReviewBySlug(slug);
  if (review) {
    return <ReviewLayout review={review} />;
  }

  // ── 2.5. Content-engine articles canonically live at /<categorySlug>/<slug>
  // (or /financial-intelligence/<slug> when uncategorized) — redirect bare hits
  // straight to that final destination instead of chaining through an
  // intermediate redirect. Checked before the news fallback below because the
  // committed article snapshot is also (incorrectly) reachable via
  // staticNewsBySlug, which previously produced a second indexable copy.
  const articleMatch =
    (await articlesService.getArticleBySlug(slug)).data ?? staticArticleBySlug(slug);
  if (articleMatch) {
    permanentRedirect(
      articleMatch.categorySlug ? `/${articleMatch.categorySlug}/${slug}` : `/financial-intelligence/${slug}`
    );
  }

  // ── 3. News articles (static set, CMS, or committed snapshot) canonically
  // live at the dated CNBC-style URL — redirect old/bare `/<slug>` hits there
  // instead of rendering a duplicate copy at this URL.
  const staticNewsMatch = newsArticles.find((a) => a.slug === slug);
  if (staticNewsMatch) {
    permanentRedirect(articleUrl(staticNewsMatch.publishedAt, slug));
  }

  let article: ArticleType | undefined = brokerGuides.find((a) => a.slug === slug);

  // Last resort: live editorial news from the CMS — same redirect treatment
  // as the static set above. (The committed article snapshot is handled by
  // the content-engine redirect above, not duplicated here.)
  if (!article) {
    const cmsMatch = await getPublishedNewsBySlug(slug);
    if (cmsMatch) {
      permanentRedirect(articleUrl(cmsMatch.publishedAt, slug));
    }
  }
  if (!article) notFound();

  const relatedArticles = newsArticles.filter(
    (a) => a.category === article.category && a.slug !== slug
  );

  const baseUrl = (env.siteUrl || 'https://imperialpedia.com').replace(/\/$/, '');
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || '',
    image: article.imageUrl ? [article.imageUrl] : [],
    author: { '@type': 'Person', name: article.author?.name || 'Imperialpedia' },
    publisher: { '@type': 'Organization', name: 'Imperialpedia', url: baseUrl },
    datePublished: article.publishedAt || '',
    dateModified: article.updatedAt || article.publishedAt || '',
    url: `${baseUrl}/${slug}`,
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'News', item: `${baseUrl}/news` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${baseUrl}/${slug}` },
    ],
  };

  return (
    <div className="bg-background min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 xl:gap-16">
          {/* ══ LEFT: Article ══════════════════════════════════════════════ */}
          <article className="md:m-16">
            {/* Category + title */}
            {article.newsLabels && article.newsLabels.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {article.newsLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-block w-fit text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-foreground text-background"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-foreground text-3xl md:text-5xl font-extrabold leading-7 tracking-wider">
              {article.title}
            </h1>

            {/* Byline */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 mb-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div>
                  By{" "}
                  <span className="font-semibold text-foreground">
                    {article.author.name}
                  </span>
                </div>
              </div>
              <span className="text-foreground">
                Published {formatDate(article.publishedAt)}
              </span>
              {article.updatedAt && (
                <span>Updated {formatDate(article.updatedAt)}</span>
              )}
            </div>

            {/* Hero image */}
            <figure className="mb-8">
              <div className="relative w-full aspect-[16/9] overflow-hidden shadow-sm">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 720px"
                  priority
                />
              </div>
              {article.imageCaption && (
                <figcaption className="mt-2 text-xs text-muted-foreground text-center">
                  {article.imageCaption}
                </figcaption>
              )}
            </figure>

            {/* Article body */}
            <div className="prose-none">
              {demoteExtraHeadings(article.body).map((block, i) => (
                <BodyBlock key={i} block={block} />
              ))}
            </div>

            {article.galleryImages && article.galleryImages.length > 0 && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {article.galleryImages.map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-sm">
                    <Image src={src} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 240px" />
                  </div>
                ))}
              </div>
            )}

            {article.externalSourceUrl && (
              <p className="mt-6 text-xs text-muted-foreground">
                Source:{" "}
                <a
                  href={article.externalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground hover:underline underline-offset-2"
                >
                  {article.externalSourceName || article.externalSourceUrl}
                </a>
              </p>
            )}
          </article>
        </div>

        {relatedArticles && relatedArticles.length > 0 && (
          <section className="pb-4 md:pb-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── Category-prefixed guide page (/<categorySlug>/<slug>) ──────────────────

/**
 * Canonical home for a content-engine guide — e.g. `/bonds/how-bond-yields-work`.
 * Renders whatever the site's own topic hubs link to; if the requested prefix
 * doesn't match the article's real CMS category (stale link, wrong guess, or
 * an uncategorized row with no category-prefixed URL at all), redirects to
 * the correct canonical instead of serving a second indexable copy.
 */
async function CategoryArticlePage({ categorySlug, articleSlug }: { categorySlug: string; articleSlug: string }) {
  const article = await resolveArticleForDetail(articleSlug);
  if (!article) notFound();

  const canonicalCategory = article.categorySlug;
  if (!canonicalCategory) {
    permanentRedirect(`/financial-intelligence/${articleSlug}`);
  }
  if (canonicalCategory !== categorySlug) {
    permanentRedirect(`/${canonicalCategory}/${articleSlug}`);
  }

  return <ArticleDetailContent article={article} />;
}

// ─── Route entry point ────────────────────────────────────────────────────────

export default async function CatchAllSlugPage({ params }: { params: Promise<SlugParams> }) {
  const { slug: segments } = await params;

  if (isDatedSegments(segments)) {
    return <DatedArticlePage segments={segments} />;
  }
  if (segments.length === 2) {
    return <CategoryArticlePage categorySlug={segments[0]} articleSlug={segments[1]} />;
  }
  if (segments.length !== 1) notFound();
  return <BareSlugPage slug={segments[0]} />;
}
