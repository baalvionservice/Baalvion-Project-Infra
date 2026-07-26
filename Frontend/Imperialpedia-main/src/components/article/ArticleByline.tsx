import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

// Minimal shape needed to render a byline link + avatar — satisfied by both
// the static config/authors.ts AuthorProfile and cms-public.ts's ResolvedAuthor
// (live CMS-managed author, preferred when both exist — see findAuthorProfileByName).
interface BylineAuthor {
  slug: string;
  avatarUrl?: string;
}

// Shared by every article template — CNBC-style byline: avatar (when the
// author profile has one) + name/title + a caller-supplied published/updated
// line. Renders without an avatar slot at all when the profile has none, so
// unstaffed/CMS-only bylines don't leave an empty circle.
export function ArticleByline({
  authorName,
  authorTitle,
  authorProfile,
  publishedLine,
}: {
  authorName: string;
  authorTitle?: string;
  authorProfile?: BylineAuthor | null;
  publishedLine: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {authorProfile?.avatarUrl && (
        <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded-full">
          <Image src={authorProfile.avatarUrl} alt={authorName} fill className="object-cover" sizes="40px" />
        </div>
      )}
      <div className="flex flex-col gap-1 text-sm">
        <span>
          By{" "}
          {authorProfile ? (
            <Link
              href={`/authors/${authorProfile.slug}`}
              className="font-semibold text-gray-900 hover:text-[#CC0000]"
            >
              {authorName}
            </Link>
          ) : (
            <span className="font-semibold text-gray-900">{authorName}</span>
          )}
          {authorTitle && <span className="text-gray-500"> · {authorTitle}</span>}
        </span>
        <span className="text-gray-500 text-xs">{publishedLine}</span>
      </div>
    </div>
  );
}
