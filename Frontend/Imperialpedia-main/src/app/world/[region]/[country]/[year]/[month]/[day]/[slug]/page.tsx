import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getPublishedNewsBySlug } from "@/services/data/cms-public";
import { staticNewsBySlug } from "@/services/data/static-content";
import { newsArticleHref } from "@/lib/data/article-url";
import { REGIONS, type RegionConfig } from "@/lib/data/worldRegions";
import { buildMetadata } from "@/lib/seo";
import { env } from "@/config/env";
import { isAllowedImageHost } from "@/lib/safe-image";
import { getAllAuthors } from "@/config/authors";
import { structuredData } from "@/lib/seo/structured-data";
import { createEntityLinker } from "@/lib/entityLinkInjector";
import { CategoryBadge } from "@/app/news/NewsArticleCard";
import { ShareBar } from "@/components/article/ShareBar";
import { ArticleMarketWidget } from "@/components/markets/ArticleMarketWidget";
import { TrendingNowModule, MoreInCategoryModule } from "@/components/article/ArticleSidebarModules";
import {
  BodyBlock,
  demoteExtraHeadings,
  extractFaqFromBlocks,
  formatDateTime,
  isValidIsoDate,
  truncateForMeta,
} from "@/lib/article/render-helpers";

type Params = Promise<{
  region: string;
  country: string;
  year: string;
  month: string;
  day: string;
  slug: string;
}>;

const REGION_BY_ID = new Map<string, RegionConfig>(REGIONS.map((r) => [r.id, r]));

// Every dated-news lookup checks the static demo set → live CMS → committed
// snapshot, same fallback chain the flat /YYYY/MM/DD/<slug> route uses, so a
// world/country article resolves the same way regardless of which URL shape
// links to it.
async function findNewsArticle(slug: string): Promise<NewsArticle | null> {
  return (
    newsArticles.find((a) => a.slug === slug) ??
    (await getPublishedNewsBySlug(slug)) ??
    staticNewsBySlug(slug) ??
    null
  );
}

// "south-korea" → "South Korea" — countries have no fixed registry (any slug
// works, no code change needed to add one), so the display label is derived
// from the slug rather than looked up.
function countryLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function findAuthorProfile(name: string) {
  const normalized = name.trim();
  return getAllAuthors().find((a) => a.name.trim() === normalized);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region, country, slug } = await params;
  const article = await findNewsArticle(slug);
  if (!article) return {};

  const canonical = newsArticleHref(article);
  const authorProfile = findAuthorProfile(article.author.name);
  const base = buildMetadata({
    title: article.title,
    description: truncateForMeta(article.excerpt),
    keywords: article.tags && article.tags.length > 0 ? article.tags : undefined,
    canonical,
    ogImage: isAllowedImageHost(article.imageUrl) ? article.imageUrl : undefined,
    ogType: "article",
  });

  const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
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
      section: `World / ${REGION_BY_ID.get(region)?.label ?? region} / ${countryLabel(country)}`,
      tags: article.tags,
    },
  };
}

export default async function WorldCountryArticlePage({ params }: { params: Params }) {
  const { region, country, slug } = await params;

  if (!REGION_BY_ID.has(region) || region === "world") notFound();

  const article = await findNewsArticle(slug);
  if (!article) notFound();

  // Single source of truth for where this article actually belongs (flat
  // dated URL, category guide, or this nested world/country shape) — if the
  // requested path isn't the article's real canonical, redirect instead of
  // serving (or indexing) a second copy under the wrong region/country/date.
  const canonicalPath = newsArticleHref(article);
  const requestedPath = `/world/${region}/${country}/${new Date(article.publishedAt).getUTCFullYear()}` +
    `/${String(new Date(article.publishedAt).getUTCMonth() + 1).padStart(2, "0")}` +
    `/${String(new Date(article.publishedAt).getUTCDate()).padStart(2, "0")}/${slug}`;
  if (canonicalPath !== requestedPath) {
    permanentRedirect(canonicalPath);
  }

  const regionConfig = REGION_BY_ID.get(region)!;
  const countryName = countryLabel(country);

  const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  const authorProfile = findAuthorProfile(article.author.name);

  const entityMentions = article.entityMentions ?? [];
  const linker = createEntityLinker(entityMentions);
  const SCHEMA_TYPE_BY_ENTITY_TYPE: Record<string, string> = {
    company: "Corporation",
    country: "Country",
    industry: "Thing",
    technology: "Thing",
  };
  const faqPairs = extractFaqFromBlocks(article.body);
  const faqSchema = faqPairs.length > 0 ? structuredData.faq(faqPairs) : null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
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
    articleSection: countryName,
    inLanguage: "en-US",
    ...(article.tags && article.tags.length > 0 ? { keywords: article.tags.join(", ") } : {}),
    ...(article.readTimeMinutes ? { timeRequired: `PT${article.readTimeMinutes}M` } : {}),
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
    ...(article.externalSourceUrl
      ? {
          citation: {
            "@type": "CreativeWork",
            name: article.externalSourceName || article.externalSourceUrl,
            url: article.externalSourceUrl,
          },
        }
      : {}),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector:
        article.keyTakeaways && article.keyTakeaways.length > 0
          ? ["h1", ".article-excerpt", ".key-points"]
          : ["h1", ".article-excerpt"],
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "World", item: `${baseUrl}/world` },
      { "@type": "ListItem", position: 3, name: regionConfig.label, item: `${baseUrl}/world/${region}` },
      { "@type": "ListItem", position: 4, name: countryName, item: canonicalUrl },
      { "@type": "ListItem", position: 5, name: article.title, item: canonicalUrl },
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
          <Link href={`/world/${region}`} className="hover:text-[#CC0000]">{regionConfig.label}</Link>
          <span>/</span>
          <span className="text-gray-400">{countryName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 xl:gap-14">
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={article.category} label={countryName} />
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
              <div className="flex flex-col gap-1 text-sm">
                <span>
                  By{" "}
                  {authorProfile ? (
                    <Link
                      href={`/authors/${authorProfile.slug}`}
                      className="font-semibold text-gray-900 hover:text-[#CC0000]"
                    >
                      {article.author.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-900">{article.author.name}</span>
                  )}
                  {article.author.title && (
                    <span className="text-gray-500"> · {article.author.title}</span>
                  )}
                </span>
                <span className="text-gray-500 text-xs">
                  Published {formatDateTime(article.publishedAt)}
                  {article.updatedAt && <> · Updated {formatDateTime(article.updatedAt)}</>}
                  {article.readTimeMinutes && <> · {article.readTimeMinutes} min read</>}
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

          <aside className="lg:sticky lg:top-24 lg:self-start space-y-8">
            <Suspense fallback={null}>
              <ArticleMarketWidget entityMentions={entityMentions} />
            </Suspense>

            <Suspense fallback={null}>
              <TrendingNowModule />
            </Suspense>

            <Suspense fallback={null}>
              <MoreInCategoryModule categorySlug={country} categoryLabel={countryName} excludeSlug={slug} />
            </Suspense>

            <Suspense fallback={null}>
              <MoreInCategoryModule categorySlug={article.categorySlug} categoryLabel={article.category} excludeSlug={slug} />
            </Suspense>
          </aside>
        </div>
      </div>
    </div>
  );
}
