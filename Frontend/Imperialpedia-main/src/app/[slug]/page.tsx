import { newsArticles, NewsBodyBlock, NewsArticle } from "@/lib/data.news";
import { stocksPageData, StocksArticle } from "@/lib/data/data.stocks";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/services/format-date";
import Image from "next/image";
import { notFound } from "next/navigation";
import { brokerGuides } from "../brokers/Components/data.brokers";
import { ArticleCard } from "../news/NewsArticleCard";
import { ReviewArticle } from "@/types/Review";
import { bestCryptoExchangesReview } from "@/data/reviews/data.reviews.crypto.exchange";
import { bestOnlineBrokersReview } from "@/data/reviews/data.reviews.online.brokers";
import { ReviewLayout } from "@/components/layout/ReviewLayout";
import { bestCdRatesReview } from "@/data/reviews/data.reviews.cd.rates";
import { bestPersonalLoans } from "@/data/reviews/data.personals.loans";
import { bestRoboAdvisers } from "@/data/reviews/data.best.robo.advisers";
import { bestMortgageRates } from "@/data/reviews/data.best.mortgage.rates";
import { bestLifeInsurance } from "@/data/reviews/data.best.live.insurance";
import { bestSavingsRates } from "@/data/reviews/data.best.savings.rate";
import { bestReliefCompanies } from "@/data/reviews/data.best.relief.companies";
import { getTermsByLetter, getTermUrl } from "@/lib/data/utils";
import { Term } from "@/lib/data/terms";
import Link from "next/link";

// ── Review imports ────────────────────────────────────────────────────────────

// ── Registry: add every new review page here ──────────────────────────────────
// Key = the slug that appears in the URL (e.g. imperialpedia.com/best-cd-rates)
const reviewRegistry: Record<string, ReviewArticle> = {
  "best-cd-rates": bestCdRatesReview,
  "best-crypto-exchanges": bestCryptoExchangesReview,
  "best-online-brokers": bestOnlineBrokersReview,
  "best-personal-loans": bestPersonalLoans,
  "best-robo-advisers": bestRoboAdvisers,
  "best-mortgage-rates": bestMortgageRates,
  "best-life-insurance": bestLifeInsurance,
  "best-savings-rates": bestSavingsRates,
  "best-debt-relief-companies": bestReliefCompanies,
};

// Union type to handle different article types
type ArticleType = NewsArticle | StocksArticle;

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check if this is a terms-beginning-with pattern
  if (slug.startsWith("terms-beginning-with-")) {
    const letter = slug.replace("terms-beginning-with-", "");
    const terms: Term[] = getTermsByLetter(letter);
    if (terms && terms.length > 0) {
      return buildMetadata({
        title: `Financial Terms Starting with "${letter.toUpperCase()}" | Imperial Finance Glossary`,
        description: `Explore our comprehensive glossary of financial terms starting with "${letter.toUpperCase()}". From A to Z, find clear definitions and expert insights on investment, economics, and market terminology to enhance your financial literacy.`,
        canonical: `/${slug}`,
        noIndex: false,
      });
    }
  }

  // Review pages get their own metadata
  const review = reviewRegistry[slug];
  if (review) {
    return buildMetadata({
      title: review.title,
      description: review.metaDescription,
      canonical: `/${slug}`,
      noIndex: false,
    });
  }

  // Standard article metadata (unchanged)
  const article = newsArticles.find((a) => a.slug === slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    canonical: `/${slug}`,
    noIndex: false,
  });
}

// ─── Body block renderer (unchanged) ─────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SingleNewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ── 1. Check if this is a terms-beginning-with pattern ──────────────────
  if (slug.startsWith("terms-beginning-with-")) {
    const letter = slug.replace("terms-beginning-with-", "");
    const terms = getTermsByLetter(letter);

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
                <h2 className="mb-2 uppercase hover:underline">
                  {term.seoTitle}
                </h2>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 2. Check review registry ──────────────────────────────────────────
  const review = reviewRegistry[slug];
  if (review) {
    return <ReviewLayout review={review} />;
  }

  // ── 3. Fall back to existing article lookup (unchanged) ──────────────────
  let article: ArticleType | undefined = newsArticles.find(
    (a) => a.slug === slug
  );
  if (!article) {
    article =
      (stocksPageData.featured.slug === slug
        ? stocksPageData.featured
        : null) ||
      brokerGuides.find((a) => a.slug === slug) ||
      stocksPageData.latest.find((a) => a.slug === slug);
  }
  if (!article) notFound();

  const relatedArticles = newsArticles.filter(
    (a) => a.category === article.category && a.slug !== slug
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 xl:gap-16">
          {/* ══ LEFT: Article ══════════════════════════════════════════════ */}
          <article className="md:m-16">
            {/* Category + title */}
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
              {article.body.map((block, i) => (
                <BodyBlock key={i} block={block} />
              ))}
            </div>
          </article>
        </div>

        {relatedArticles && relatedArticles.length > 0 && (
          <section className="pb-4 md:pb-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Related Articles
            </h2>
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
