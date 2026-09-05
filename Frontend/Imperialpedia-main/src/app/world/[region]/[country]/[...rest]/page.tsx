import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getPublishedNewsBySlug, findAuthorProfileByName } from "@/services/data/cms-public";
import { staticNewsBySlug } from "@/services/data/static-content";
import { newsArticleHref, labelFromSlug } from "@/lib/data/article-url";
import { REGIONS, type RegionConfig } from "@/lib/data/worldRegions";
import { getCountryTimezone } from "@/lib/data/countryTimezones";
import { CountryLocalClock } from "@/components/world/CountryLocalClock";
import { buildMetadata } from "@/lib/seo";
import { env } from "@/config/env";
import { isAllowedImageHost } from "@/lib/safe-image";
import { structuredData } from "@/lib/seo/structured-data";
import { createEntityLinker } from "@/lib/entityLinkInjector";
import { CategoryBadge } from "@/app/news/NewsArticleCard";
import { ShareBar } from "@/components/article/ShareBar";
import { ArticleMarketWidget } from "@/components/markets/ArticleMarketWidget";
import { ArticleByline } from "@/components/article/ArticleByline";
import { TrendingNowModule, MoreInCategoryModule } from "@/components/article/ArticleSidebarModules";
import { ListenBar } from "@/components/article/ListenBar";
import { KeyTakeawaysBox } from "@/components/pages/KeyTakeawaysBox";
import {
  BodyBlock,
  demoteExtraHeadings,
  extractFaqFromBlocks,
  formatDateTime,
  isValidIsoDate,
  plainTextFromBody,
  truncateForMeta,
} from "@/lib/article/render-helpers";

type Params = Promise<{ region: string; country: string; rest: string[] }>;

const REGION_BY_ID = new Map<string, RegionConfig>(REGIONS.map((r) => [r.id, r]));

/**
 * A single catch-all handles both permalink depths under /world/<region>/<country>/:
 *   - 4 segments: [YYYY, MM, DD, slug]          → country-level article
 *   - 5 segments: [state, YYYY, MM, DD, slug]   → state-level article
 * A regular `[year]` folder and a `[state]` folder can't be siblings (Next.js
 * requires every dynamic segment at the same position to share one name), so
 * catch-all + manual length parsing is the way to support both depths.
 */
function parseRest(rest: string[]): { state?: string; year: string; month: string; day: string; slug: string } | null {
  if (rest.length === 4) {
    const [year, month, day, slug] = rest;
    return { year, month, day, slug };
  }
  if (rest.length === 5) {
    const [state, year, month, day, slug] = rest;
    return { state, year, month, day, slug };
  }
  return null;
}

// Same fallback chain as the flat /YYYY/MM/DD/<slug> route, so an article
// resolves the same way regardless of which URL shape links to it.
async function findNewsArticle(slug: string): Promise<NewsArticle | null> {
  return (
    newsArticles.find((a) => a.slug === slug) ??
    (await getPublishedNewsBySlug(slug)) ??
    staticNewsBySlug(slug) ??
    null
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region, country, rest } = await params;
  const parsed = parseRest(rest);
  if (!parsed) return {};
  const article = await findNewsArticle(parsed.slug);
  if (!article) return {};

  const canonical = newsArticleHref(article);
  const authorProfile = await findAuthorProfileByName(article.author.name);
  const base = buildMetadata({
    title: article.title,
    description: truncateForMeta(article.excerpt),
    keywords: article.tags && article.tags.length > 0 ? article.tags : undefined,
    canonical,
    ogImage: isAllowedImageHost(article.imageUrl) ? article.imageUrl : undefined,
    ogType: "article",
  });

  const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const sectionParts = [
    "World",
    REGION_BY_ID.get(region)?.label ?? region,
    labelFromSlug(country),
    ...(parsed.state ? [labelFromSlug(parsed.state)] : []),
  ];
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
      section: sectionParts.join(" / "),
      tags: article.tags,
    },
  };
}

/**
 * Empty on purpose — see the root [...slug] route. These country articles render
 * the same heavy template (CMS article + trending rail + "more in category"),
 * and without this export Next rebuilt every one of them from scratch on every
 * request. Nothing is prerendered at build; on-demand renders are cached.
 */
export async function generateStaticParams(): Promise<
  { region: string; country: string; rest: string[] }[]
> {
  return [];
}

export const revalidate = 86400;

export default async function WorldCountryArticlePage({ params }: { params: Params }) {
  const { region, country, rest } = await params;

  if (!REGION_BY_ID.has(region) || region === "world") notFound();

  const parsed = parseRest(rest);
  if (!parsed) notFound();
  const { state, slug } = parsed;

  const article = await findNewsArticle(slug);
  if (!article) notFound();

  // Single source of truth for where this article actually belongs (flat
  // dated URL, category guide, country-level, or state-level) — if the
  // requested path isn't the article's real canonical, redirect instead of
  // serving (or indexing) a second copy under the wrong region/country/state/date.
  const canonicalPath = newsArticleHref(article);
  const datePrefix = `${new Date(article.publishedAt).getUTCFullYear()}` +
    `/${String(new Date(article.publishedAt).getUTCMonth() + 1).padStart(2, "0")}` +
    `/${String(new Date(article.publishedAt).getUTCDate()).padStart(2, "0")}`;
  const requestedPath = state
    ? `/world/${region}/${country}/${state}/${datePrefix}/${slug}`
    : `/world/${region}/${country}/${datePrefix}/${slug}`;
  if (canonicalPath !== requestedPath) {
    permanentRedirect(canonicalPath);
  }

  const regionConfig = REGION_BY_ID.get(region)!;
  const countryName = labelFromSlug(country);
  const stateName = state ? labelFromSlug(state) : null;
  const countryTimeZone = getCountryTimezone(country);
  const leafName = stateName ?? countryName;

  const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  const authorProfile = await findAuthorProfileByName(article.author.name);

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
    articleSection: leafName,
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

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "World", item: `${baseUrl}/world` },
    { "@type": "ListItem", position: 3, name: regionConfig.label, item: `${baseUrl}/world/${region}` },
    {
      "@type": "ListItem",
      position: 4,
      name: countryName,
      item: stateName ? `${baseUrl}/world/${region}/${country}` : canonicalUrl,
    },
    ...(stateName ? [{ "@type": "ListItem" as const, position: 5, name: stateName, item: canonicalUrl }] : []),
    { "@type": "ListItem", position: stateName ? 6 : 5, name: article.title, item: canonicalUrl },
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <div className="bg-background min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/world" className="hover:text-[#CC0000]">World</Link>
            <span>/</span>
            <Link href={`/world/${region}`} className="hover:text-[#CC0000]">{regionConfig.label}</Link>
            <span>/</span>
            {stateName ? (
              <>
                <Link href={`/world/${region}/${country}`} className="hover:text-[#CC0000]">{countryName}</Link>
                <span>/</span>
                <span className="text-muted-foreground/70">{stateName}</span>
              </>
            ) : (
              <span className="text-muted-foreground/70">{countryName}</span>
            )}
          </nav>
          {countryTimeZone && <CountryLocalClock country={countryName} timeZone={countryTimeZone} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 xl:gap-14">
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={article.category} label={leafName} />
              {article.newsLabels?.map((label) => (
                <span
                  key={label}
                  className="inline-block w-fit text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-foreground text-background"
                >
                  {label}
                </span>
              ))}
            </div>

            <h1 className="text-foreground text-3xl md:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight mt-3">
              {article.title}
            </h1>

            <p className="article-excerpt text-lg text-muted-foreground leading-relaxed mt-4 max-w-2xl">
              {article.excerpt}
            </p>

            {article.keyTakeaways && article.keyTakeaways.length > 0 && (
              <KeyTakeawaysBox items={article.keyTakeaways} />
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 py-5 mt-5 border-y border-border">
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
                <figcaption className="mt-2 text-xs text-muted-foreground text-center">
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
              <p className="mt-6 text-xs text-muted-foreground">
                Source:{" "}
                <a
                  href={article.externalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground hover:text-[#CC0000] underline underline-offset-2"
                >
                  {article.externalSourceName || article.externalSourceUrl}
                </a>
              </p>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold text-muted-foreground bg-muted rounded-full px-3 py-1"
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

            {stateName && (
              <Suspense fallback={null}>
                <MoreInCategoryModule categorySlug={state} categoryLabel={stateName} excludeSlug={slug} />
              </Suspense>
            )}

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
