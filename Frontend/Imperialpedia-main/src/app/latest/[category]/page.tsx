import { buildMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { LIVE_CATEGORIES, LiveCategory } from "../types";
import { LatestNewsClient } from "../components/LatestNewsClient";

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

  return <LatestNewsClient initialCategory={match.value as LiveCategory} />;
}