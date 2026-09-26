import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ReviewArticle } from "@/types/Review";
import { ReviewHero } from "../review/ReviewHero";
import { ComparisonTable } from "../review/ComparisionTable";
import { ProviderReview } from "../review/ProviderReview";
import { ReviewMethodology } from "../review/ReviewMethodology";
import { ReviewFAQ } from "../review/ReviewFaq";

/**
 * Visible trust/responsibility signal — distinct from the "Advertiser Disclosure"
 * footer below, which covers compensation. This answers a different question users
 * and Google both weigh on YMYL pages that send traffic toward opening an account or
 * making a purchase: who is actually responsible for the product once you sign up.
 * Placed high on the page (right under the hero), not buried in a footer, since
 * that visibility is itself part of the E-E-A-T signal.
 */
function ResponsibilityNotice() {
  return (
    <div className="my-8 rounded-xl border-l-4 border-primary bg-primary/5 p-5 flex items-start gap-3">
      <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Who&apos;s responsible if you sign up:</span>{" "}
        Imperialpedia is an independent publisher — we research, test, and write these
        reviews, but we are not a bank, broker, exchange, lender, or insurer. Each
        company reviewed here is solely responsible for its own product terms, account
        service, and support once you open an account or make a purchase with them.
        Rates, fees, and terms can change after publication — always confirm current
        details directly with the provider before signing up. See our{" "}
        <Link href="/editorial-policy" className="text-primary hover:underline">
          Editorial Policy
        </Link>{" "}
        and{" "}
        <Link href="/affiliate-disclosure" className="text-primary hover:underline">
          Affiliate Disclosure
        </Link>{" "}
        for how we review and may be compensated.
      </p>
    </div>
  );
}

export function ReviewLayout({ review }: { review: ReviewArticle }) {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">

        {/* 1. Hero + trust bar + our picks jump cards */}
        <ReviewHero review={review} />

        {/* 1b. Visible responsibility/trust signal for users + Google (YMYL) */}
        <ResponsibilityNotice />

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