import Image from "next/image";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { Provider } from "@/types/Review";

export function ProviderReview({ provider }: { provider: Provider }) {
  // Title: "Fidelity Investments: Best Overall, Best for ETFs, Best for Low Costs"
  const titleSuffix = provider.categoryLabels.join(", ");

  return (
    <section
      id={provider.id}
      className="scroll-mt-20 pt-10 pb-12 border-b border-border last:border-0"
    >

      {/* ── 1. H2 title: Name: Label1, Label2 + stars ─────────────────── */}
      <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-4">
        {provider.name}:{" "}
        <span className="font-bold">{titleSuffix}</span>{" "}
        <span className="inline-flex items-center gap-1.5 align-middle ml-1">
          <StarRating score={provider.overallScore} size="md" />
        </span>
      </h2>

      {/* ── 2. Logo + CTA  |  Fast Facts box ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-5 mb-8">

        {/* Left: logo + button stacked */}
        <div className="flex flex-col items-start gap-3 flex-shrink-0">
          <div className="relative w-36 h-16">
            <Image
              src={provider.logoUrl}
              alt={provider.name}
              fill
              className="object-contain object-left"
              sizes="144px"
            />
          </div>
          <Link
            href={provider.ctaUrl}
            target="_blank"
            rel="noopener sponsored"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded transition-colors whitespace-nowrap"
          >
            {provider.ctaLabel}
          </Link>
        </div>

        {/* Right: Fast Facts box */}
        <div className="flex-1 border border-border rounded-sm px-5 py-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Fast Facts
          </p>
          <dl className="space-y-1.5">
            {provider.fastFacts.map((fact) => (
              <div key={fact.label} className="text-sm text-foreground">
                <span className="font-semibold">{fact.label}:</span>{" "}
                <span>{fact.value}</span>
              </div>
            ))}
          </dl>
          <a
            href={`#${provider.id}-full`}
            className="inline-block mt-3 text-sm text-blue-600 hover:underline"
          >
            Read full review
          </a>
        </div>
      </div>

      {/* ── 3. Why We Chose It ────────────────────────────────────────── */}
      <div className="mb-8" id={`${provider.id}-full`}>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Why We Chose It
        </h3>
        <div className="space-y-4">
          {provider.whyWeChoseIt.map((section) => (
            <div key={section.heading}>
              <h4 className="text-base font-bold text-foreground mb-1">
                {section.heading}
              </h4>
              <p className="text-[0.9375rem] leading-relaxed text-foreground">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Pros & Cons ────────────────────────────────────────────── */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Pros & Cons</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-border rounded-sm overflow-hidden">

          {/* Pros */}
          <div className="p-5 border-b sm:border-b-0 sm:border-r border-border">
            <p className="text-sm font-bold text-foreground mb-3">Pros</p>
            <ul className="space-y-2.5">
              {provider.pros.map((pro, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-foreground leading-snug"
                >
                  <span className="mt-[0.45rem] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-foreground" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="p-5">
            <p className="text-sm font-bold text-foreground mb-3">Cons</p>
            <ul className="space-y-2.5">
              {provider.cons.map((con, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-foreground leading-snug"
                >
                  <span className="mt-[0.45rem] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-foreground" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── 5. Overview ───────────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-3">Overview</h3>
        <p className="text-[0.9375rem] leading-relaxed text-foreground">
          {provider.overview}
        </p>
        {provider.affiliateDisclosure && (
          <p className="mt-4 text-xs text-muted-foreground italic">
            {provider.affiliateDisclosure}
          </p>
        )}
      </div>

    </section>
  );
}