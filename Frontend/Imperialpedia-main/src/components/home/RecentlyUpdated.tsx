import React from "react";
import { loadCountries, loadCompanies, loadTechnologies } from "@/lib/data/loaders";
import { EntityListItem } from "@/components/lists/EntityListItem";
import { HomeSectionHeading } from "./HomeSectionHeading";
import type { BaseEntity, CompanyEntity } from "@/types/entity";

const RECENT_COUNT = 6;

/**
 * "Recently Updated" rail — surfaces the most recently edited knowledge-graph
 * entities across all four types, sorted by `updated_at`. This is what makes
 * the homepage read as a living reference rather than a static landing page:
 * an edit made in the admin platform becomes visible here within the
 * loaders' 5-minute revalidation window.
 */
export async function RecentlyUpdated() {
  const [countries, companies, technologies] = await Promise.all([
    loadCountries(),
    loadCompanies(),
    loadTechnologies(),
  ]);

  const all: BaseEntity[] = [...countries, ...companies, ...technologies];
  const recent = [...all]
    .filter((e) => e.updated_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, RECENT_COUNT);

  if (recent.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Recently Updated" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recent.map((entity) => (
          <EntityListItem
            key={`${entity.type}:${entity.slug}`}
            name={entity.name}
            type={entity.type}
            category={entity.category}
            description={entity.description}
            slug={entity.slug}
            logo={entity.type === "company" ? (entity as CompanyEntity).logo : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default RecentlyUpdated;
