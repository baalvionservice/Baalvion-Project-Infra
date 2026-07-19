import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  title: string;
  href?: string;
  hrefLabel?: string;
};

/**
 * Shared section heading for homepage discovery rails — mirrors TopicSection's
 * accent-bar + "More" link pattern so the whole homepage reads as one system
 * instead of mixing the editorial layer with a different visual language.
 */
export function HomeSectionHeading({ title, href, hrefLabel = "More" }: Props) {
  return (
    <div className="flex items-end justify-between mb-5">
      <h2 className="flex items-center text-xl font-black uppercase tracking-tight text-foreground">
        <span className="mr-3 h-5 w-1.5 bg-accent" aria-hidden />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline underline-offset-2"
        >
          {hrefLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export default HomeSectionHeading;
