import React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

type Props = {
  term: string;
  definition: string;
  href: string;
};

/**
 * "Term of the Day" callout — Investopedia's dictionary hook. Gold-accented
 * editorial box pointing into the glossary.
 */
export function TermOfDay({ term, definition, href }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="border border-border bg-secondary/50">
        <div className="flex flex-col md:flex-row">
          <div className="flex items-center gap-3 bg-foreground text-background px-6 py-5 md:w-64 md:flex-shrink-0">
            <BookOpen className="h-6 w-6 text-accent" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-accent">
                Term of the Day
              </div>
              <div className="font-headline text-2xl font-black leading-tight">{term}</div>
            </div>
          </div>
          <div className="flex-1 px-6 py-5">
            <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">{definition}</p>
            <Link
              href={href}
              className="group mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline underline-offset-2"
            >
              Read full definition
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TermOfDay;
