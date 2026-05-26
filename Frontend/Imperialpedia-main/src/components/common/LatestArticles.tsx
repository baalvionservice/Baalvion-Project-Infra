"use client";

import { NewsArticle, newsArticles } from "@/lib/data.news";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PodcastEpisode {
  id: string;
  show: string;
  title: string;
  episodeNumber: number;
  date: string;
  slug: string;
  imageUrl?: string; // only featured episode has image
}

// ─── Static data ──────────────────────────────────────────────────────────────

const podcastEpisodes: PodcastEpisode[] = [
  {
    id: "1",
    show: "The Imperialpedia Express",
    title: "Behind the Bitcoin Breakdown",
    episodeNumber: 285,
    date: "Mar 16, 2026",
    slug: "behind-the-bitcoin-breakdown",
    imageUrl:
      "https://picsum.photos/90/90",
  },
  {
    id: "2",
    show: "",
    title: "Wealth Management in the Age of AI",
    episodeNumber: 285,
    date: "Mar 09, 2026",
    slug: "wealth-management-age-of-ai",
  },
  {
    id: "3",
    show: "",
    title: "Fallout From the Attack on Iran",
    episodeNumber: 284,
    date: "Mar 03, 2026",
    slug: "fallout-attack-on-iran",
  },
];

const sentimentData = {
  imageUrl:
    "https://picsum.photos/600/320",
  category: "Original Research",
  title: "Quarterly Investor Sentiment Survey",
  excerpt:
    "Individual investors remain mostly confident and optimistic despite bubble fears.",
  href: "#",
};

const promoCard = {
  imageUrl:
    "https://picsum.photos/600/320",
  title: "Invest Like Her: Portfolios That Match Your Life",
  description:
    "Discover how women can build smarter investment portfolios that match their real lives.",
  href: "#",
};

// ─── Scrollable Article Card ──────────────────────────────────────────────────

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <div className="flex-shrink-0 w-[220px] flex flex-col gap-2">
      <Link
        href={`/${article.slug}`}
        className="relative block w-full h-[148px] overflow-hidden bg-gray-100"
      >
        <Image
          src={article.imageUrl || "https://picsum.photos/220/148"}
          alt={article.title}
          fill
          className="object-cover hover:scale-[1.03] transition-transform duration-300"
          sizes="220px"
        />
      </Link>

      <div
        
        className="text-[10px] font-bold tracking-[0.12em] uppercase text-blue-700 hover:underline leading-none"
      >
        {article.category ?? "Personal Finance News"}
      </div>

      <Link href={`/${article.slug}`}>
        <h3 className="text-[14px] font-bold text-foreground hover:text-blue-700 leading-snug transition-colors">
          {article.title}
        </h3>
      </Link>

      <p className="text-[12px] text-gray-500 mt-auto">
        {article.publishedAt
          ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
          : ""}
      </p>
    </div>
  );
}

// ─── Bottom Card 1: Sentiment / Original Research ─────────────────────────────

function SentimentCard() {
  return (
    <div className="flex flex-col gap-3">
      {/* Chart image */}
      <Link
        href={sentimentData.href}
        className="relative block w-full h-[160px] overflow-hidden bg-gray-100 border border-gray-200"
      >
        <Image
          src={sentimentData.imageUrl}
          alt={sentimentData.title}
          fill
          className="object-cover"
          sizes="33vw"
        />
      </Link>

      {/* Category */}
      <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-blue-700">
        {sentimentData.category}
      </span>

      {/* Title */}
      <Link href={sentimentData.href}>
        <h3 className="text-[15px] font-bold text-foreground hover:text-blue-700 leading-snug transition-colors">
          {sentimentData.title}
        </h3>
      </Link>

      {/* Excerpt + Read more inline */}
      <p className="text-[13px] text-gray-600 leading-relaxed">
        {sentimentData.excerpt}{" "}
        <Link
          href={sentimentData.href}
          className="text-blue-700 font-medium hover:underline"
        >
          Read more
        </Link>
      </p>
    </div>
  );
}

// ─── Bottom Card 2: Latest Podcast Episodes ───────────────────────────────────

function PodcastCard() {
  const [featured, ...rest] = podcastEpisodes;
  return (
    <div className="flex flex-col gap-4">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 whitespace-nowrap">
          Latest Podcast Episodes
        </span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Featured episode — image left, text right */}
      <div className="flex gap-3 group">
        <div className="relative shrink-0 w-[90px] h-[90px] overflow-hidden bg-gray-100">
          <Image
            src={featured.imageUrl!}
            alt={featured.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="90px"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-blue-700">
            {featured.show}
          </span>
          <h4 className="text-[14px] font-bold text-foreground group-hover:text-blue-700 leading-snug transition-colors">
            {featured.title}
          </h4>
          <p className="text-[12px] text-gray-500">
            Episode #{featured.episodeNumber}&nbsp;|&nbsp;{featured.date}
          </p>
        </div>
      </div>

      {/* Other episodes — text only with play icon */}
      <div className="flex flex-col gap-3">
        {rest.map((ep) => (
          <div
            key={ep.id}
            className="flex items-start gap-2 group"
          >
            {/* Play icon */}
            <svg
              className="shrink-0 mt-[2px]"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <rect width="18" height="18" rx="2" fill="#1a3a6e" />
              <polygon points="7,5 13,9 7,13" fill="white" />
            </svg>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13.5px] font-semibold text-foreground group-hover:text-blue-700 leading-snug transition-colors">
                {ep.title}
              </span>
              <p className="text-[11px] text-gray-500">
                Episode #{ep.episodeNumber}&nbsp;|&nbsp;{ep.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bottom Card 3: Promo / Editorial Card ────────────────────────────────────

function PromoCard() {
  return (
    <div className="flex flex-col border border-gray-200 overflow-hidden">
      {/* Illustration image */}
      <div className="relative w-full h-[180px] bg-amber-50 overflow-hidden">
        <Image
          src={promoCard.imageUrl}
          alt={promoCard.title}
          fill
          className="object-cover"
          sizes="33vw"
        />
      </div>

      {/* Text + CTA */}
      <div className="p-5 flex flex-col gap-3">
        <h3 className="text-[16px] font-bold text-foreground leading-snug">
          {promoCard.title}
        </h3>
        <p className="text-[13px] text-gray-600 leading-relaxed">
          {promoCard.description}
        </p>
        <Link
          href={promoCard.href}
          className="mt-1 self-start inline-flex items-center gap-2 bg-[#1a3a6e] hover:bg-[#152f5a] transition-colors text-white text-[12px] font-bold tracking-[0.08em] uppercase px-5 py-2.5"
        >
          Read More &gt;
        </Link>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function LatestArticles() {
  const latestArticles: NewsArticle[] = newsArticles;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const SCROLL_AMOUNT = 460;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollLeft = () =>
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });

  const scrollRight = () =>
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });

  // Simulate Banner

  function SimulatorBanner() {
    return (
      <div className="relative w-full bg-background overflow-hidden mt-10 flex flex-col md:flex-row items-center">
        {/* Left: text content */}
        <div className="flex flex-col gap-5 px-8 py-10 md:py-12 md:w-[42%] shrink-0 z-10">
          <h2 className="font-serif text-[2rem] md:text-[2.4rem] font-bold text-foreground leading-tight">
            Imperialpedia Stock Market Simulator
          </h2>
          <p className="text-[14px] text-foreground/70 leading-relaxed max-w-sm">
            Practice stock trading with virtual money — trusted by over 3
            million educated investors. Trade by yourself or compete with
            others. Free to sign up.
          </p>
          <Link
            href="#"
            className="self-start inline-flex items-center bg-[#1a3a6e] hover:bg-[#152f5a] transition-colors text-white text-[12px] font-bold tracking-[0.1em] uppercase px-6 py-3"
          >
            Start Trading
          </Link>
        </div>

        {/* Right: device mockup image */}
        <div className="relative w-full md:flex-1 h-[260px] md:h-[320px]">
          <Image
            src="https://picsum.photos/600/400"
            alt="Imperialpedia Stock Market Simulator"
            fill
            className="object-contain object-center md:object-left-bottom"
            sizes="60vw"
          />
        </div>
      </div>
    );
  }
  return (
    <section className="w-full bg-background py-6">
      <div className="max-w-[1320px] mx-auto px-4">
        {/* ── Section heading ── */}
        <h2 className="text-xl font-bold text-foreground mb-4">
          Latest Articles
        </h2>

        {/* ── Scrollable carousel ── */}
        <div className="relative mb-10">
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              aria-label="Scroll left"
              className="absolute -left-5 top-[74px] -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-300 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path
                  d="M8.5 1L1.5 8L8.5 15"
                  stroke="#1a1a1a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={scrollRight}
              aria-label="Scroll right"
              className="absolute -right-2 top-[74px] -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-300 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path
                  d="M1.5 1L8.5 8L1.5 15"
                  stroke="#1a1a1a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* ── 3 bottom cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SentimentCard />
          <PodcastCard />
          <PromoCard />
        </div>

        {/* ── Simulator banner ── */}
        <SimulatorBanner />
      </div>
    </section>
  );
}
