import { cache, Suspense } from "react";
import { newsArticles, NewsArticle, NewsCategory } from "@/lib/data.news";
import { getPublishedNewsBySlug, findAuthorProfileByName } from "@/services/data/cms-public";
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
import { GLOSSARY_LIVE } from "@/config/glossary";
import { articleUrl } from "@/lib/data/article-url";
import { ShareBar } from "@/components/article/ShareBar";
import { articlesService } from "@/services/data";
import { ArticleMarketWidget } from "@/components/markets/ArticleMarketWidget";
import { isAllowedImageHost } from "@/lib/safe-image";
import { structuredData } from "@/lib/seo/structured-data";
import { createEntityLinker } from "@/lib/entityLinkInjector";
import {
  resolveArticleForDetail,
  buildArticleDetailMetadata,
  ArticleDetailContent,
} from "@/modules/content-engine/render/article-detail";
import {
  BodyBlock,
  canonicalSegments,
  demoteExtraHeadings,
  extractFaqFromBlocks,
  formatDateTime,
  isValidIsoDate,
  plainTextFromBody,
  truncateForMeta,
} from "@/lib/article/render-helpers";
import { TrendingNowModule, MoreInCategoryModule } from "@/components/article/ArticleSidebarModules";
import { ArticleByline } from "@/components/article/ArticleByline";
import { ListenBar } from "@/components/article/ListenBar";

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

// Permanently retired article slugs — deleted from cms-service, but kept blocked
// here too as a hard guarantee: a stale Vercel Data/Route Cache entry from before
// the deletion (or any future ISR regeneration hiccup on a not-found result) can
// never resurrect one of these, since this check short-circuits before any fetch.
const RETIRED_ARTICLE_SLUGS = new Set([
  "checklist-before-choosing-any-financial-product",
  "common-bank-fees-and-how-to-avoid-them",
  "credit-card-apr-and-grace-periods-explained",
  "credit-unions-vs-banks",
  "how-regulators-protect-financial-consumers",
  "how-to-evaluate-a-credit-card-offer",
  "how-to-evaluate-a-robo-advisor",
  "how-to-evaluate-an-insurance-company",
  "how-to-interpret-fed-rate-announcements",
  "how-to-switch-banks-without-disruption",
  "insider-trading-form-4-filings-explained",
  "insurance-financial-strength-ratings-explained",
  "market-news-terminology-glossary",
  "mergers-and-acquisitions-explained",
  "online-banks-vs-traditional-banks",
  "reading-earnings-season-news-coverage",
  "red-flags-in-financial-product-marketing",
  "robo-advisor-fee-structures-explained",
  "separating-market-noise-from-signal",
  "stock-buybacks-and-dividends-explained",
  "understanding-sec-filings-10k-10q-8k",
  "understanding-star-ratings-and-review-methodology-limitations",
  "building-multiple-income-streams",
  "cost-of-living-adjustments-and-real-income",
  "estimated-quarterly-taxes-for-freelancers",
  "fdic-deposit-insurance-explained",
  "health-insurance-deductibles-copays-coinsurance-explained",
  "homeowners-vs-renters-insurance",
  "how-insurance-premiums-are-calculated",
  "how-much-life-insurance-coverage-you-need",
  "how-to-evaluate-a-bank-before-opening-an-account",
  "how-to-evaluate-a-brokerage-before-you-open-an-account",
  "how-to-evaluate-customer-reviews-and-spot-fake-ones",
  "how-to-negotiate-a-raise-or-salary",
  "how-to-read-a-quarterly-earnings-report",
  "how-w4-paycheck-withholding-works",
  "how-we-review-financial-products-and-services",
  "side-income-1099-vs-w2-basics",
  "sipc-protection-explained",
  "standard-deduction-vs-itemizing",
  "tax-credits-vs-tax-deductions-explained",
  "understanding-company-news-what-moves-stock-prices",
]);

// Wrapped in React's cache() so generateMetadata and the page component — which
// both resolve the same slug on every request — share one lookup (and one
// live cms-service round-trip) instead of two, per Next's documented pattern
// for sharing data between generateMetadata and the page it describes.
const findNewsArticle = cache(async (slug: string): Promise<NewsArticle | null> => {
  if (RETIRED_ARTICLE_SLUGS.has(slug)) return null;
  return (
    newsArticles.find((a) => a.slug === slug) ??
    (await getPublishedNewsBySlug(slug)) ??
    staticNewsBySlug(slug) ??
    null
  );
});

// Only categories with a real browse destination under /latest get a linked
// breadcrumb/category crumb — keeps BreadcrumbList schema honest (no crumb
// pointing nowhere) instead of linking every category and 404ing on the rest.
const CATEGORY_HREF: Partial<Record<NewsCategory, string>> = {
  Markets: "/latest/markets",
  Stocks: "/latest/stocks",
  Crypto: "/latest/crypto",
  Economy: "/latest/economy",
  PersonalFinance: "/latest/personalfinance",
};

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<SlugParams> }) {
  const { slug: segments } = await params;

  if (isDatedSegments(segments)) {
    const [, , , articleSlug] = segments;
    const article = await findNewsArticle(articleSlug);
    if (!article) return {};

    const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
    const authorProfile = await findAuthorProfileByName(article.author.name);
    const base = buildMetadata({
      title: article.title,
      description: truncateForMeta(article.excerpt),
      keywords: article.tags && article.tags.length > 0 ? article.tags : undefined,
      canonical: articleUrl(article.publishedAt, articleSlug),
      // Some articles fall back to an inline `data:image/svg+xml,...` illustration
      // (see @baalvion/illustrations) when no hosted artwork exists yet — that's fine
      // for the on-page <Image>, but social unfurlers and crawlers fetch og:image as
      // an HTTP(S) URL and can't resolve a data URI, so it must never reach this tag.
      // buildMetadata falls back to the sitewide default OG image when this is undefined.
      ogImage: isAllowedImageHost(article.imageUrl) ? article.imageUrl : undefined,
      ogType: "article",
    });

    return {
      ...base,
      authors: [
        {
          name: article.author.name,
          url: authorProfile ? `${baseUrl}/authors/${authorProfile.slug}` : undefined,
        },
      ],
      openGraph: {
        ...base.openGraph,
        type: "article",
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt || article.publishedAt,
        authors: [article.author.name],
        section: article.category,
        tags: article.tags,
      },
    };
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
  if (GLOSSARY_LIVE && slug.startsWith("terms-beginning-with-")) {
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

// ─── Dated CNBC-style article page (/YYYY/MM/DD/slug) ────────────────────────

async function DatedArticlePage({ segments }: { segments: [string, string, string, string] }) {
  const [year, month, day, slug] = segments;
  const article = await findNewsArticle(slug);
  if (!article) notFound();

  const canonical = canonicalSegments(article.publishedAt);
  if (canonical.year !== year || canonical.month !== month || canonical.day !== day) {
    permanentRedirect(articleUrl(article.publishedAt, slug));
  }

  const readMoreLinks = (article.related ?? []).filter((r) => r.href && r.href !== "#");

  const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const canonicalPath = articleUrl(article.publishedAt, slug);
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  const authorProfile = await findAuthorProfileByName(article.author.name);
  const categoryPath = CATEGORY_HREF[article.category];

  // Persisted, save-time entity-mention detection (full body, all 4 entity
  // types, aliases-aware) — see entityMentionDetectionService.js. One real
  // detector feeds both the sidebar quote widget and the internal links
  // rendered below, and the `mentions` JSON-LD entities here.
  const entityMentions = article.entityMentions ?? [];
  const linker = createEntityLinker(entityMentions);
  const SCHEMA_TYPE_BY_ENTITY_TYPE: Record<string, string> = {
    company: "Corporation",
    country: "Country",
    industry: "Thing",
    technology: "Thing",
  };
  const faqPairs = extractFaqFromBlocks(article.body);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    // Optional fields are only included when there's a real, valid value —
    // an empty string or [] in JSON-LD is worse than omitting the key, since
    // some validators/consumers treat a present-but-empty field as a filled one.
    ...(article.excerpt ? { description: article.excerpt } : {}),
    ...(isAllowedImageHost(article.imageUrl) ? { image: [article.imageUrl] } : {}),
    author: {
      "@type": "Person",
      name: article.author?.name || "Imperialpedia",
      ...(authorProfile ? { url: `${baseUrl}/authors/${authorProfile.slug}` } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "Imperialpedia",
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png`, width: 512, height: 512 },
    },
    ...(isValidIsoDate(article.publishedAt) ? { datePublished: article.publishedAt } : {}),
    ...(isValidIsoDate(article.updatedAt) || isValidIsoDate(article.publishedAt)
      ? { dateModified: isValidIsoDate(article.updatedAt) ? article.updatedAt : article.publishedAt }
      : {}),
    url: canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    articleSection: article.category,
    inLanguage: "en-US",
    ...(article.tags && article.tags.length > 0 ? { keywords: article.tags.join(", ") } : {}),
    ...(article.readTimeMinutes ? { timeRequired: `PT${article.readTimeMinutes}M` } : {}),
    // "about" = the topics this article covers (editorial tags, already curated —
    // not inferred/fabricated); "mentions" = the real, tracked entities named in
    // it. Both feed Google's Knowledge Graph / entity understanding and give AI
    // answer engines (ChatGPT Search, Perplexity, AI Overviews) a structured
    // handle on what the article is actually about, beyond the prose itself.
    ...(article.tags && article.tags.length > 0
      ? { about: article.tags.map((tag) => ({ "@type": "Thing", name: tag })) }
      : {}),
    ...(entityMentions.length > 0
      ? {
          mentions: entityMentions.map((m) => ({
            "@type": SCHEMA_TYPE_BY_ENTITY_TYPE[m.entityType] || "Thing",
            name: m.entityName,
            url: `${baseUrl}${m.entityUrl}`,
          })),
        }
      : {}),
    // Wire-style articles that credit a source get that source described as a
    // real citation, not just a plain-text "Source:" link in the body.
    ...(article.externalSourceUrl
      ? {
          citation: {
            "@type": "CreativeWork",
            name: article.externalSourceName || article.externalSourceUrl,
            url: article.externalSourceUrl,
          },
        }
      : {}),
    // Lets voice assistants and AI answer engines read back a concise summary
    // instead of the full body — points at the real H1 + excerpt DOM nodes below.
    // ".key-points" is only added when that section actually renders (see JSX).
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector:
        article.keyTakeaways && article.keyTakeaways.length > 0
          ? ["h1", ".article-excerpt", ".key-points"]
          : ["h1", ".article-excerpt"],
    },
  };

  // Only emitted when the article's own body already contains question-headed
  // sections with real answers underneath — see extractFaqFromBlocks. Never
  // fabricates questions; this is the same visible body content, described.
  const faqSchema = faqPairs.length > 0 ? structuredData.faq(faqPairs) : null;

  // Breadcrumb schema must mirror what's actually rendered in the <nav> below —
  // a mismatch between visible breadcrumbs and BreadcrumbList schema risks a
  // manual action for misleading structured data, so the category crumb is only
  // added here (and only links) when CATEGORY_HREF has a real destination for it.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "World", item: `${baseUrl}/world` },
      ...(categoryPath
        ? [{ "@type": "ListItem", position: 3, name: article.category, item: `${baseUrl}${categoryPath}` }]
        : []),
      { "@type": "ListItem", position: categoryPath ? 4 : 3, name: article.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="bg-white min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Link href="/world" className="hover:text-[#CC0000]">World</Link>
          <span>/</span>
          {categoryPath ? (
            <Link href={categoryPath} className="text-gray-500 hover:text-[#CC0000]">
              {article.category}
            </Link>
          ) : (
            <span className="text-gray-400">{article.category}</span>
          )}
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

            <p className="article-excerpt text-lg text-gray-600 leading-relaxed mt-4 max-w-2xl">
              {article.excerpt}
            </p>

            {article.keyTakeaways && article.keyTakeaways.length > 0 && (
              <div className="key-points mt-6 border border-gray-200 bg-gray-50 rounded-sm p-5">
                <h2 className="text-xs font-black tracking-widest text-gray-900 uppercase mb-3">
                  Key Points
                </h2>
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
              <ArticleByline
                authorName={article.author.name}
                authorTitle={article.author.title}
                authorProfile={authorProfile}
                publishedLine={
                  <>
                    Published {formatDateTime(article.publishedAt)}
                    {article.updatedAt && <> · Updated {formatDateTime(article.updatedAt)}</>}
                  </>
                }
              />
              <ShareBar url={canonicalUrl} title={article.title} />
            </div>

            <ListenBar text={plainTextFromBody(article.body)} estimatedMinutes={article.readTimeMinutes} />

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
                <BodyBlock key={i} block={block} linker={linker} />
              ))}
            </div>

            {article.galleryImages && article.galleryImages.length > 0 && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {article.galleryImages.map((src, i) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-sm">
                    <Image
                      src={src}
                      alt={`${article.title} — photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 240px"
                    />
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
            {/* getAssetQuote (inside this widget) is a live, no-store fetch with up to
                a 6s timeout — Suspense keeps a slow/degraded quote API from blocking
                the primary article content (title, byline, hero image) from streaming,
                which would otherwise directly threaten LCP/TTFB. */}
            <Suspense fallback={null}>
              <ArticleMarketWidget entityMentions={entityMentions} />
            </Suspense>

            <Suspense fallback={null}>
              <TrendingNowModule />
            </Suspense>

            <Suspense fallback={null}>
              <MoreInCategoryModule categorySlug={article.categorySlug} categoryLabel={article.category} excludeSlug={slug} />
            </Suspense>

            {/* Demo/placeholder related links carry href="#" — filtered out so the
                sidebar never renders an internal link that goes nowhere. */}
            {readMoreLinks.length > 0 && (
              <div>
                <h2 className="text-xs font-black tracking-widest text-gray-900 uppercase border-b-2 border-gray-200 pb-2 mb-4">
                  Read More
                </h2>
                <ul className="space-y-3">
                  {readMoreLinks.map((r) => (
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
    if (!GLOSSARY_LIVE) notFound();

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
                {article.galleryImages.map((src, i) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-sm">
                    <Image
                      src={src}
                      alt={`${article.title} — photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 240px"
                    />
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
