import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TopicGroup } from "./types";
import { ArticleCard } from "./ArticleCard";

/**
 * A topic row: section heading with accent rule + a responsive grid of cards.
 * The repeated building block of the Investopedia homepage body. When the
 * category has a real photo attached (admin Categories → Category Photo),
 * it renders as a wide banner behind the heading instead of plain text.
 */
export function TopicSection({ group }: { group: TopicGroup }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      {group.categoryImage && (
        <Link
          href={group.href}
          className="relative mb-5 block aspect-[21/6] w-full overflow-hidden rounded-lg bg-muted"
        >
          <Image
            src={group.categoryImage}
            alt={group.title}
            fill
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <h2 className="absolute bottom-4 left-5 text-2xl font-black uppercase tracking-tight text-white">
            {group.title}
          </h2>
        </Link>
      )}
      <div className="flex items-end justify-between mb-5">
        {!group.categoryImage && (
          <h2 className="flex items-center text-xl font-black uppercase tracking-tight text-foreground">
            <span className="mr-3 h-5 w-1.5 bg-accent" aria-hidden />
            {group.title}
          </h2>
        )}
        <Link
          href={group.href}
          className="group ml-auto inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline underline-offset-2"
        >
          More
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {group.articles.map((a) => (
          <ArticleCard key={a.href + a.title} article={a} />
        ))}
      </div>
    </section>
  );
}
