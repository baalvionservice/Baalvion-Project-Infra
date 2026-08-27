import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { getArticlesByCategory } from "@/modules/content-engine/services/content-service";
import { newsArticleHref } from "@/lib/data/article-url";
import { HomeSectionHeading } from "./HomeSectionHeading";

const TALKS_CATEGORY = "Imperialpedia Talks";
const MAX_TALKS = 4;

/**
 * "Imperialpedia Talks" — a video-interview column (mirroring Outlook
 * Money's "Nidhi Talks"), styled as a 4-up teaser grid with the same
 * thumbnail + play-icon grammar as `news/VideoCarousel.tsx`. Gated on the
 * CMS `videoUrl` field (see `modules/content-engine/types/article.ts`) the
 * same way VideoCarousel is — renders nothing until an editor actually
 * attaches a real video to a Talks article, so this never ships a fake
 * "play" button with no video behind it.
 */
export async function ImperialpediaTalks() {
  const { data } = await getArticlesByCategory(TALKS_CATEGORY);

  const talks = data
    .filter((a) => !!a.videoUrl)
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime())
    .slice(0, MAX_TALKS);

  if (talks.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Imperialpedia Talks" href={`/${talks[0].categorySlug || ""}`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {talks.map((talk) => (
          <Link
            key={talk.slug}
            href={newsArticleHref({
              slug: talk.slug,
              publishedAt: talk.publishedAt || talk.updatedAt,
              contentType: talk.contentType,
              categorySlug: talk.categorySlug,
            })}
            className="group block"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              {talk.featuredImage && (
                <Image
                  src={talk.featuredImage}
                  alt={talk.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                <PlayCircle className="h-10 w-10 text-white drop-shadow" />
              </div>
            </div>
            <h3 className="mt-2.5 text-sm font-bold leading-snug text-foreground group-hover:text-primary line-clamp-3">
              {talk.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
