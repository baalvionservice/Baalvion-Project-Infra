"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { useCallback } from "react";
import type { CmsArticle } from "@/lib/cms";
import { resolveArticleImage } from "@/lib/article-art";
import { articleUrl } from "@/lib/article-url";

type Props = {
  articles: CmsArticle[];
};

interface VideoItem {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  duration?: string;
}

/** Reads CMS-authored video fields; returns [] until editors attach video content. */
function extractVideos(articles: CmsArticle[]): VideoItem[] {
  return articles
    .filter((a) => typeof a.customFields?.videoUrl === "string" && a.customFields.videoUrl)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      thumbnail:
        (typeof a.customFields?.videoThumbnail === "string" && a.customFields.videoThumbnail) ||
        resolveArticleImage(a),
      duration: typeof a.customFields?.videoDuration === "string" ? a.customFields.videoDuration : undefined,
    }));
}

/** Horizontal video carousel — renders nothing until the CMS has real video content. */
export function VideoCarousel({ articles }: Props) {
  const videos = extractVideos(articles);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!videos.length) return null;

  return (
    <section>
      <div className="section-rule">
        <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
        <h2>Video News</h2>
      </div>
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {videos.map((video) => (
              <Link
                href={articleUrl(video)}
                key={video.id}
                className="group block shrink-0 basis-2/3 sm:basis-1/2 lg:basis-1/3"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    sizes="(max-width: 768px) 66vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <PlayCircle className="h-12 w-12 text-white drop-shadow" />
                  </div>
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      {video.duration}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-headline text-sm font-semibold leading-snug text-slate-900 dark:text-white line-clamp-2 group-hover:text-news-600 transition-colors">
                  {video.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous videos"
          className="hidden sm:flex absolute -left-4 top-1/3 h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next videos"
          className="hidden sm:flex absolute -right-4 top-1/3 h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
