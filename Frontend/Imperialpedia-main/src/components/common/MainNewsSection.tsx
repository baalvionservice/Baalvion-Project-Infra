import { newsArticles } from "@/lib/data.news";
import { stocksPageData } from "@/lib/data/data.stocks";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RelatedLink {
  label: string;
  href: string;
}

interface FeaturedArticleProps {
  imageUrl: string;
  title: string;
  slug: string;
  author: { name: string };
  publishedAt?: string;
  excerpt?: string;
  related?: RelatedLink[];
  large?: boolean;
}

interface OtherStory {
  title: string;
  href: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const BestFinancialProducts = [
  { rate: "5.00%", label: "Earn 5.00% APY While You Can", cta: "Compare Rates" },
  { rate: "4.25%", label: "Lock in the Best 6-Month CD Rate Now", cta: "Compare Rates" },
  { rate: "4.25%", label: "Earn a Top CD Rate for 1 Year", cta: "Compare Rates" },
  { rate: "4.20%", label: "Lock in Until 2028 With the Best 2-Year CD", cta: "Compare Rates" },
];

const TopPicksForMarch = [
  { label: "Today's Best CD Rates", href: "#" },
  { label: "Today's Best Mortgage Rates", href: "#" },
  { label: "Best Brokers and Trading Platforms", href: "#" },
];

const OtherTopStories: OtherStory[] = [
  { title: "Supermicro Stock Drops 33% After Co-Founder Charged With Smuggling AI Tech to China", href: "#" },
  { title: "These Nvidia-Backed Stocks Have Surged as Wall Street Analysts Grow More Bullish", href: "#" },
  { title: "FedEx Stock Rises on Strong Earnings, Rosy Outlook", href: "#" },
  { title: "How To Know Which Consumer Stocks the Iran War Has Put Most at Risk", href: "#" },
  { title: "EV Maker Rivian Gets Into the Robotaxi Race With Uber Partnership", href: "#" },
  { title: "Why Accenture's CEO Says Entry-Level Workers May Not Be the Ones Struggling in the AI Era", href: "#" },
];

// ─── Related Links ────────────────────────────────────────────────────────────

function RelatedLinks({ links }: { links: RelatedLink[] }) {
  return (
    <div className="mt-3">
      <span className="block text-[10px] font-bold tracking-widest uppercase text-gray-400 pb-2 mb-2 border-b border-dashed border-gray-300">
        Related
      </span>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-start gap-2 text-[13px] text-foreground/80 hover:text-blue-700 leading-snug"
            >
              <span className="mt-[3px] shrink-0 w-[3px] h-[14px] bg-blue-700 inline-block" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function FeaturedArticleCard({
  imageUrl,
  title,
  slug,
  author,
  publishedAt,
  excerpt,
  related,
  large = false,
}: FeaturedArticleProps) {
  return (
    <article className="flex flex-col">
      <Link
        href={`/${slug}`}
        className="relative block w-full aspect-video overflow-hidden bg-gray-100"
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover hover:scale-[1.02] transition-transform duration-300"
          sizes={large ? "55vw" : "35vw"}
          priority={large}
        />
      </Link>

      <div className="flex flex-col gap-2 pt-3">
        <Link href={`/${slug}`}>
          <h2
            className={`font-serif font-bold leading-snug text-foregound hover:text-blue-700 transition-colors ${large ? "text-2xl md:text-[1.55rem]" : "text-xl md:text-[1.3rem]"
              }`}
          >
            {title}
          </h2>
        </Link>

        {excerpt && (
          <p className="text-[13px] text-foreground/60 leading-relaxed">{excerpt}</p>
        )}

        <p className="text-xs text-foreground/50">
          By {author.name}
          {publishedAt && <span className="text-foreground/60"> | {new Date(publishedAt).getHours()} hours ago</span>}
        </p>

        {related && related.length > 0 && <RelatedLinks links={related} />}
      </div>
    </article>
  );
}

// ─── Financial Product Card ───────────────────────────────────────────────────

function FinancialProductCard({
  rate,
  label,
  cta,
}: (typeof BestFinancialProducts)[number]) {
  return (
    <div className="py-3 border-b border-gray-200 last:border-b-0">
      <p className="font-serif text-[1.55rem] font-bold text-foregrond leading-none mb-1">
        {rate}
      </p>
      <div className="w-9 h-[3px] bg-blue-700 mb-2 rounded-sm" />
      <p className="text-[13px] text-foreground/80 leading-snug mb-1">{label}</p>
      <Link href="#" className="text-[13px] text-blue-700 font-medium hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

// ─── Other Top Stories ────────────────────────────────────────────────────────

function OtherTopStoriesSection({ stories }: { stories: OtherStory[] }) {
  return (
    <div className="pt-5 border-t border-gray-300">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 whitespace-nowrap">
          Other Top Stories
        </span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* 2-column grid of story links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
        {stories.map((story,i) => (
          <Link
            key={story.href + story.title + i}
            href={story.href}
            className="text-[13.5px] font-semibold text-foreground hover:text-blue-700 leading-snug transition-colors"
          >
            {story.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export const MainNewsSection =  () => {
  const leftArticle: FeaturedArticleProps = newsArticles.find((a) => a.featured)!;

  const rightArticle: FeaturedArticleProps = stocksPageData.featured;
  return (
    <section className="w-full bg-background">
      <div className="max-w-[1320px] mx-auto px-4">

        {/* ── Main 3-column grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_300px]">

          {/* ── Left column: featured article + other top stories ── */}
          <div className="md:pr-7 md:border-r md:border-gray-200 py-5 flex flex-col gap-5">
            <FeaturedArticleCard {...leftArticle} large />

            {/* Other Top Stories spans left + center cols on md — handled below */}
          </div>

          {/* ── Center column: secondary article ── */}
          <div className="py-5 border-t border-gray-200 md:border-t-0 md:px-7 md:border-r md:border-gray-200">
            <FeaturedArticleCard {...rightArticle} />
          </div>

          {/* ── Right sidebar ── */}
          <aside className="py-5 border-t border-gray-200 md:border-t-0 md:pl-6 flex flex-col">
            {/* Financial Products */}
            <h3 className="font-serif font-bold text-[15px] text-foreground text-center pb-3 mb-1 border-b-2 border-gray-200">
              Find the Best Financial Products
            </h3>
            <div className="flex flex-col">
              {BestFinancialProducts.map((p) => (
                <FinancialProductCard key={p.label} {...p} />
              ))}
            </div>

            {/* Top Picks for March */}
            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-blue-700 mb-3">
                Our Top Picks for March:
              </p>
              <ul className="flex flex-col gap-2">
                {TopPicksForMarch.map((pick) => (
                  <li key={pick.label} className="flex items-start gap-2">
                    <span className="mt-[5px] shrink-0 w-[5px] h-[5px] rounded-full bg-gray-800 inline-block" />
                    <Link
                      href={pick.href}
                      className="text-[13px] text-foreground/80 hover:text-blue-700 leading-snug"
                    >
                      {pick.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* ── Other Top Stories — spans left + center cols only ── */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_300px]">
          <div className="md:col-span-2 md:pr-7 md:border-r md:border-gray-200 pb-6">
            <OtherTopStoriesSection stories={OtherTopStories} />
          </div>
          {/* Empty cell to keep sidebar gap aligned */}
          <div />
        </div>

      </div>
    </section>
  );
};