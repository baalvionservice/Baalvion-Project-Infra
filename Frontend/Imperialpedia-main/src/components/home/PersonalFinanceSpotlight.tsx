import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArticleCard } from "@/components/landing/investopedia/ArticleCard";
import { HomeSectionHeading } from "./HomeSectionHeading";
import type { PersonalFinanceSpotlight as PersonalFinanceSpotlightData } from "./getHomeEditorial";
import { CategoryBadge } from "@/components/common/CategoryBadge";

type Props = {
  spotlight: PersonalFinanceSpotlightData | null;
};

/**
 * Dedicated "Personal Finance" homepage section — a lead story beside a
 * stack of secondary cards and a headline-only "Popular" list underneath,
 * mirroring how reference personal-finance sites (e.g. Outlook Money) give
 * the category its own spotlight rather than a generic topic row. Renders
 * nothing until the category has real published content — see
 * `getHomeEditorial.ts` for the dedup pass that keeps every pick here
 * distinct from the lead/topic/latest sections above it.
 */
export function PersonalFinanceSpotlight({ spotlight }: Props) {
  if (!spotlight) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Personal Finance" href="/personal-finance" />
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10">
        <Link href={spotlight.lead.href} className="group block">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
            <Image
              src={spotlight.lead.image}
              alt={spotlight.lead.title}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="pt-4">
            <CategoryBadge category={spotlight.lead.category} />
            <h3 className="mt-1.5 text-xl sm:text-2xl font-black leading-tight text-foreground group-hover:text-primary">
              {spotlight.lead.title}
            </h3>
            {spotlight.lead.dek && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{spotlight.lead.dek}</p>
            )}
          </div>
        </Link>

        <div>
          {spotlight.secondary.length > 0 && (
            <div>
              {spotlight.secondary.map((a) => (
                <ArticleCard key={a.href} article={a} variant="row" />
              ))}
            </div>
          )}

          {spotlight.popular.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Popular in Personal Finance
              </h4>
              <ul>
                {spotlight.popular.map((a) => (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="block py-2 border-b border-border last:border-0 text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-2"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
