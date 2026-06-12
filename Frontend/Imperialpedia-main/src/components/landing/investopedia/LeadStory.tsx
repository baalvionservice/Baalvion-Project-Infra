import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Article } from "./types";
import { ArticleCard } from "./ArticleCard";

const img = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

type Props = {
  lead: Article;
  secondary: Article[];
};

/**
 * Hero editorial block: large lead story with image + serif headline, beside a
 * column of secondary headlines. Investopedia's homepage "above the fold".
 */
export function LeadStory({ lead, secondary }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lead */}
        <div className="lg:col-span-2">
          <Link href={lead.href} className="group block">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
              <Image
                src={img(lead.imageSeed, 1280, 720)}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="pt-4">
              <span className="eyebrow">{lead.category}</span>
              <h2 className="mt-1.5 text-3xl sm:text-4xl font-black leading-[1.08] text-foreground group-hover:text-primary">
                {lead.title}
              </h2>
              {lead.dek && (
                <p className="mt-3 text-base text-muted-foreground max-w-2xl">{lead.dek}</p>
              )}
              {lead.author && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  By {lead.author}
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* Secondary headlines */}
        <aside className="lg:col-span-1 lg:border-l lg:border-border lg:pl-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pb-3 mb-1 border-b-2 border-foreground">
            Top Stories
          </h3>
          <div>
            {secondary.map((a) => (
              <ArticleCard key={a.href + a.title} article={a} variant="row" />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default LeadStory;
