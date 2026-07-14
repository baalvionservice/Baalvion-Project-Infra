import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { NewsArticle } from "@/lib/data.news";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { newsArticleHref } from "@/lib/data/article-url";

type Props = {
  articles: NewsArticle[];
};

interface VideoItem {
  id: string;
  slug: string;
  publishedAt: string;
  contentType?: string;
  title: string;
  thumbnail: string;
  duration?: string;
}

/** Reads CMS-authored video fields; returns [] until editors attach video content. */
function extractVideos(articles: NewsArticle[]): VideoItem[] {
  return articles
    .filter((a) => typeof a.customFields?.videoUrl === "string" && a.customFields.videoUrl)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      publishedAt: a.publishedAt,
      contentType: a.contentType,
      title: a.title,
      thumbnail:
        (typeof a.customFields?.videoThumbnail === "string" && a.customFields.videoThumbnail) ||
        a.imageUrl,
      duration: typeof a.customFields?.videoDuration === "string" ? a.customFields.videoDuration : undefined,
    }));
}

/** Horizontal video carousel — renders nothing until the CMS has real video content. */
export function VideoCarousel({ articles }: Props) {
  const videos = extractVideos(articles);
  if (!videos.length) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        Video News
      </h2>
      <Carousel opts={{ align: "start" }} className="w-full">
        <CarouselContent>
          {videos.map((video) => (
            <CarouselItem key={video.id} className="basis-2/3 sm:basis-1/2 lg:basis-1/3">
              <Link href={newsArticleHref(video)} className="group block">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl">
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
                <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:underline">
                  {video.title}
                </h3>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </section>
  );
}
