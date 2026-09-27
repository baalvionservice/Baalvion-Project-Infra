import { ReviewArticle } from "@/types/Review";

export function ReviewMethodology({ review }: { review: ReviewArticle }) {
  return (
    <section
      id="methodology"
      className="scroll-mt-20 my-12 rounded-2xl border border-border bg-muted/30 p-6 md:p-8"
    >
      {/* Icon + heading */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          How We Evaluated These{" "}
          {review.title.replace(/best\s/i, "").replace(/of.*/i, "").trim()}
        </h2>
      </div>

      <p className="text-[1.0625rem] leading-[1.85] text-foreground mb-4">
        {review.methodology}
      </p>

      {/* Reviewed by footer */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
        <span>
          Reviewed by{" "}
          <span className="font-semibold text-foreground">
            {review.reviewedBy.name}
          </span>
          {review.reviewedBy.title && `, ${review.reviewedBy.title}`}
        </span>
        {review.factCheckedBy && (
          <>
            <span>·</span>
            <span>
              Fact-checked by{" "}
              <span className="font-semibold text-foreground">
                {review.factCheckedBy.name}
              </span>
              {review.factCheckedBy.title && `, ${review.factCheckedBy.title}`}
            </span>
          </>
        )}
        <span>·</span>
        <span>
          Updated{" "}
          {new Date(review.lastUpdated).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    </section>
  );
}