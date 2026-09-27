import Link from "next/link";
import type { ReviewArticle } from "@/types/Review";
import { StarRating } from "./StarRating";

type Props = {
  review: ReviewArticle;
};

/** Surfaces one real "Best X Compared" pillar page from the review registry —
 * real title, real subhead, and the real top pick's editorial score. Never
 * fabricates a rating or provider that isn't already in the review data. */
export function BuyingGuideCard({ review }: Props) {
  const topPick = [...review.providers].sort((a, b) => b.overallScore - a.overallScore)[0];

  return (
    <Link
      href={`/${review.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-900"
    >
      <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline">
        {review.title}
      </h3>
      <p className="text-xs leading-relaxed text-gray-500 line-clamp-2">{review.subhead}</p>
      {topPick && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <span className="truncate text-xs font-semibold text-gray-500">Top pick: {topPick.name}</span>
          <StarRating score={topPick.overallScore} />
        </div>
      )}
    </Link>
  );
}
