import { buildMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { LIVE_CATEGORIES, LiveCategory } from "../types";
import { LatestNewsClient } from "../components/LatestNewsClient";
import { LATEST_CATEGORY_COPY } from "../category-copy";
import { getSiteContent } from "@/lib/data/site-content";

// ─── Static params — one route per category ───────────────────────────────────
export function generateStaticParams() {
  return LIVE_CATEGORIES.filter((c) => c.value !== "All").map((c) => ({
    category: c.value.toLowerCase(),
  }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const match = LIVE_CATEGORIES.find(
    (c) => c.value.toLowerCase() === category.toLowerCase()
  );
  if (!match) return {};
  return buildMetadata({
    title: `${match.label} News — Live Updates`,
    description: `Live ${match.label} financial news, analysis, and key insights streamed in real time.`,
    canonical: `/latest/${category.toLowerCase()}`,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CategoryLatestPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  // Match the URL segment back to a LiveCategory value
  const match = LIVE_CATEGORIES.find(
    (c) => c.value.toLowerCase() === category.toLowerCase()
  );

  if (!match || match.value === "All") notFound();

  const fallback = LATEST_CATEGORY_COPY[match.value as Exclude<LiveCategory, "All">];
  // Admin-managed override (Imperialpedia > Site Content, type "latest-category")
  // takes precedence over the bundled default in category-copy.ts.
  const live = await getSiteContent<{ title?: string; intro?: string }>("latest-category", category.toLowerCase());
  const copy = { ...fallback, ...(live ?? {}) };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-3">
          {copy.title}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{copy.intro}</p>
      </div>
      <LatestNewsClient initialCategory={match.value as LiveCategory} />
    </>
  );
}