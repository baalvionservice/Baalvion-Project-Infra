import React from "react";
import Link from "next/link";
import { Building2, Globe2, Factory, Cpu, ArrowRight } from "lucide-react";
import { loadCountries, loadCompanies, loadIndustries, loadTechnologies } from "@/lib/data/loaders";
import { HomeSectionHeading } from "./HomeSectionHeading";

/**
 * "Categories" / "Popular Entities" rail — the primary internal-linking gap
 * found in the pre-rebuild homepage audit: the site's entire encyclopedia
 * side (companies/countries/industries/technologies) had zero links from `/`.
 * Counts are computed from the same live-first loaders the index pages use,
 * so they never drift from what those pages actually list.
 */
export async function KnowledgeCategories() {
  const [countries, companies, industries, technologies] = await Promise.all([
    loadCountries(),
    loadCompanies(),
    loadIndustries(),
    loadTechnologies(),
  ]);

  const categories = [
    { label: "Companies", href: "/companies", count: companies.length, icon: Building2 },
    { label: "Countries", href: "/countries", count: countries.length, icon: Globe2 },
    { label: "Industries", href: "/industries", count: industries.length, icon: Factory },
    { label: "Technologies", href: "/technologies", count: technologies.length, icon: Cpu },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Explore the Knowledge Graph" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(({ label, href, count, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col justify-between rounded-lg border border-border p-5 hover:border-primary transition-colors"
          >
            <Icon className="h-6 w-6 text-primary" aria-hidden />
            <div className="mt-6">
              <span className="block text-2xl font-black text-foreground">{count}</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                {label}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default KnowledgeCategories;
