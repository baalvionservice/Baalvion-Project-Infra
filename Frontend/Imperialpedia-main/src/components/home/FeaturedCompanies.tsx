import React from "react";
import { loadCompanies } from "@/lib/data/loaders";
import { EntityListItem } from "@/components/lists/EntityListItem";
import { HomeSectionHeading } from "./HomeSectionHeading";

const FEATURED_COUNT = 4;

/**
 * "Featured Companies" rail. Prefers companies with a verified logo (a proxy
 * for profile completeness) so the featured set favors better-documented
 * entities; falls back to dataset order when none have logos yet.
 */
export async function FeaturedCompanies() {
  const companies = await loadCompanies();
  if (companies.length === 0) return null;

  const withLogo = companies.filter((c) => c.logo);
  const featured = (withLogo.length > 0 ? withLogo : companies).slice(0, FEATURED_COUNT);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Featured Companies" href="/companies" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featured.map((company) => (
          <EntityListItem
            key={company.id}
            name={company.name}
            type="company"
            category={company.industry}
            description={company.description}
            slug={company.slug}
          />
        ))}
      </div>
    </section>
  );
}

export default FeaturedCompanies;
