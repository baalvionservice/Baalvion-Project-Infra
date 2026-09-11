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
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <HomeSectionHeading title="IMPERIALPEDIA TALKS // VIDEO" href={`/${talks[0].categorySlug || ""}`} hrefLabel="ALL TALKS →" />
      
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
            className="group block bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(200,16,46,1)] transition-all relative"
          >
            <div className="relative aspect-video w-full overflow-hidden border-2 border-black dark:border-slate-700 bg-muted">
              {talk.featuredImage && (
                <Image
                  src={talk.featuredImage}
                  alt={talk.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                <div className="bg-[#c8102e] text-white p-3 rounded-full border-2 border-black shadow-md transform group-hover:scale-110 transition-transform">
                  <PlayCircle className="h-6 w-6 fill-white text-[#c8102e]" />
                </div>
              </div>
              <div className="absolute top-2 left-2">
                <span className="bg-black text-white text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 border border-white/40">
                  INTERVIEW
                </span>
              </div>
            </div>
            <div className="pt-3 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c8102e]">
                // IMPERIALPEDIA EXCLUSIVE TALKS
              </span>
              <h3 className="text-sm font-black uppercase font-serif leading-snug text-black dark:text-white group-hover:text-[#c8102e] transition-colors line-clamp-3">
                {talk.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
