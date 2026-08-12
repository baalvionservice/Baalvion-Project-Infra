import React from "react";
import Link from "next/link";
import Image from "next/image";
import { AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Article } from "./types";

type Props = {
  lead: Article;
  leadRelated: Article[];
  secondaryLead: Article | null;
  secondaryLeadRelated: Article[];
  otherTopStories: Article[];
};

function HeroStory({ article, related, priority }: { article: Article; related: Article[]; priority?: boolean }) {
  return (
    <div>
      <Link href={article.href} className="group block">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <Image
            src={article.image}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="pt-4">
          <span className="eyebrow">{article.category}</span>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-black leading-[1.1] text-foreground group-hover:text-primary">
            {article.title}
          </h2>
          {article.dek && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{article.dek}</p>
          )}
          {article.author && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              By {article.author}
            </p>
          )}
        </div>
      </Link>

      {related.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dashed border-border">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Related
          </span>
          <ul className="mt-2 space-y-2.5">
            {related.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="group flex items-start gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  <AlignLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="line-clamp-2">{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Hero editorial block, Investopedia-style: two lead stories side by side —
 * each with its own image, headline, dek, byline, and a "Related" list of
 * same-category articles — followed by a headline-only "Other Top Stories"
 * list. `secondaryLead` and every related/other-stories slot are only
 * populated with real same-category (or otherwise real, unused) articles;
 * see getHomeEditorial.ts — nothing here is padded with placeholder content
 * when the CMS doesn't have enough to fill a slot.
 */
export function LeadStory({ lead, leadRelated, secondaryLead, secondaryLeadRelated, otherTopStories }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className={cn("grid grid-cols-1 gap-10", secondaryLead && "lg:grid-cols-2")}>
        <HeroStory article={lead} related={leadRelated} priority />
        {secondaryLead && <HeroStory article={secondaryLead} related={secondaryLeadRelated} />}
      </div>

      {otherTopStories.length > 0 && (
        <div className="mt-10 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pb-2 mb-1 border-b-2 border-foreground">
            Other Top Stories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
            {otherTopStories.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="block py-2.5 border-b border-border text-sm font-bold text-foreground hover:text-primary transition-colors"
              >
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default LeadStory;
