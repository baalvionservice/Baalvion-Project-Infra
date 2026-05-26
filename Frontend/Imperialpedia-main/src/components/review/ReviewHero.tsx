import Image from "next/image";
import Link from "next/link";
import { ReviewArticle } from "@/types/Review";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

// ─── Trust / editorial bar ────────────────────────────────────────────────────
function TrustBar({ review }: { review: ReviewArticle }) {
    return (
        <div className="flex flex-col items-start gap-x-6 gap-y-2 text-sm text-muted-foreground py-3 my-6">
            <div className="flex items-center gap-2">

                <span>
                    By{" "}
                    <span className="font-semibold text-foreground">
                        {review.reviewedBy.name}
                    </span>

                </span>
                <div className="flex items-center gap-1.5">

                    <span>Updated {formatDate(review.lastUpdated)}</span>
                </div>
            </div>


            {review.factCheckedBy && (
                <div className="flex items-center gap-1.5">

                    <span>
                        Fact-checked by{" "}
                        <span className="font-semibold text-foreground">
                            {review.factCheckedBy.name}
                        </span>
                    </span>
                </div>
            )}




        </div>
    );
}

// ─── Our Picks jump cards ─────────────────────────────────────────────────────
function PicksGrid({ review }: { review: ReviewArticle }) {
    return (
        <section className="my-8">
            <ul className="flex flex-col gap-2">
                {review.picks.map((pick) => (
                    <li key={pick.providerId} className="flex items-center gap-2 text-base">
                        {/* Bullet dot */}
                        <span className="text-foreground text-lg leading-none">•</span>

                        {/* Category label */}
                        <span className="font-bold text-foreground">
                            {pick.categoryLabel}:
                        </span>

                        {/* Provider name as link */}
                        <Link href={pick.ctaUrl} className="text-blue-600 hover:underline">
                            {pick.providerName}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function ReviewHero({ review }: { review: ReviewArticle }) {
    return (
        <div>


            {/* H1 */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
                {review.title}
            </h1>
            {/* Trust bar */}
            <TrustBar review={review} />

            {/* Subhead */}
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {review.subhead}
            </p>



            {/* Our picks jump links */}
            <PicksGrid review={review} />
        </div>
    );
}