import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HomeSectionHeading } from "./HomeSectionHeading";

const SOURCES = [
  { name: "Federal Reserve", url: "https://www.federalreserve.gov" },
  { name: "SEC", url: "https://www.sec.gov" },
  { name: "FINRA", url: "https://www.finra.org" },
  { name: "IRS", url: "https://www.irs.gov" },
  { name: "Bureau of Labor Statistics", url: "https://www.bls.gov" },
  { name: "Bureau of Economic Analysis", url: "https://www.bea.gov" },
  { name: "World Bank", url: "https://www.worldbank.org" },
  { name: "IMF", url: "https://www.imf.org" },
] as const;

/**
 * Homepage teaser for the full Sources & Methodology page — explains how
 * sources are selected rather than just listing logos, per the same
 * reasoning as the full page: naming an institution without saying how it's
 * used isn't a real trust signal.
 */
export function SourcesMethodology() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 border-t border-border/60">
      <HomeSectionHeading title="Our Sources" href="/methodology" hrefLabel="Read our full methodology" />
      <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
        For factual financial and economic information, Imperialpedia may reference authoritative
        sources including the institutions below — the regulator or agency that sets the rule or
        publishes the data, cited directly rather than through an intermediary. Every article&apos;s
        specific citations appear in its own &ldquo;Sources &amp; References&rdquo; section.
      </p>
      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        {SOURCES.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              {source.name}
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <Link
        href="/methodology"
        className="mt-5 inline-block text-sm font-bold text-primary hover:underline underline-offset-2"
      >
        How we select and use sources →
      </Link>
    </section>
  );
}
