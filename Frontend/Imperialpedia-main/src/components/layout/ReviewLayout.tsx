import { ReviewArticle } from "@/types/Review";
import { ReviewHero } from "../review/ReviewHero";
import { ComparisonTable } from "../review/ComparisionTable";
import { ProviderReview } from "../review/ProviderReview";
import { ReviewMethodology } from "../review/ReviewMethodology";
import { ReviewFAQ } from "../review/ReviewFaq";

export function ReviewLayout({ review }: { review: ReviewArticle }) {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">

        {/* 1. Hero + trust bar + our picks jump cards */}
        <ReviewHero review={review} />

        {/* 2. Full comparison table */}
      {review.comparisonColumns &&  <ComparisonTable review={review} />}

        {/* Divider with label */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            Full Reviews
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* 3. Individual provider reviews (one per pick) */}
        <div>
          {review.providers.map((provider) => (
            <ProviderReview key={provider.id} provider={provider} />
          ))}
        </div>

        {/* 4. Methodology */}
        <ReviewMethodology review={review} />

        {/* 5. FAQ with JSON-LD */}
        <ReviewFAQ review={review} />

        {/* 6. Advertiser disclosure footer */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold">Advertiser Disclosure:</span>{" "}
            Imperialpedia may receive compensation from some providers listed on
            this page. This does not influence our rankings or editorial
            judgments. Our editorial team independently researches and evaluates
            all products. Compensation may affect which products we feature and
            their order, but not our assessments.
          </p>
        </div>
      </div>
    </div>
  );
}