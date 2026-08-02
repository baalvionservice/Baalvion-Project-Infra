import React from "react";
import Link from "next/link";
import {
  Building2,
  Globe2,
  Cpu,
  ArrowRight,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  loadCountries,
  loadCompanies,
  loadTechnologies,
} from "@/lib/data/loaders";
import { HomeSectionHeading } from "./HomeSectionHeading";

interface FeaturedEntity {
  name: string;
  href: string;
}

interface CategoryData {
  label: string;
  href: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  featured: FeaturedEntity[];
}

/**
 * Refactored Knowledge Graph section: instead of showing thin counts, this is
 * a rich discovery hub with featured entities pulled from the same live-first
 * loaders the index pages use — featured items are real entities with real
 * slugs, never hand-picked placeholders that could drift and 404.
 */
export async function KnowledgeCategoriesRefactored() {
  const [countries, companies, technologies] = await Promise.all([
    loadCountries(),
    loadCompanies(),
    loadTechnologies(),
  ]);

  const toFeatured = (entities: Array<{ name: string; slug: string }>, base: string): FeaturedEntity[] =>
    entities.slice(0, 3).map((e) => ({ name: e.name, href: `${base}/${e.slug}` }));

  const categories: CategoryData[] = [
    {
      label: "Companies",
      href: "/companies",
      count: companies.length,
      icon: Building2,
      description:
        "In-depth profiles, financial metrics, and market analysis for public and private companies globally.",
      featured: toFeatured(companies, "/companies"),
    },
    {
      label: "Countries",
      href: "/countries",
      count: countries.length,
      icon: Globe2,
      description:
        "Economic indicators, trade data, and regulatory landscapes for countries worldwide.",
      featured: toFeatured(countries, "/countries"),
    },
    {
      label: "Technologies",
      href: "/technologies",
      count: technologies.length,
      icon: Cpu,
      description:
        "Market trends, industry impact, and investment opportunities in emerging and established technologies.",
      featured: toFeatured(technologies, "/technologies"),
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
      <div className="mb-8">
        <HomeSectionHeading title="Explore the Knowledge Graph" />
        <p className="text-sm text-muted-foreground mt-2">
          A comprehensive encyclopedia of companies, countries, and technologies with live data, market insights, and expert analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map(
          ({ label, href, count, icon: Icon, description, featured }) => (
            <div
              key={href}
              className="flex flex-col rounded-lg border border-border p-6 hover:border-primary hover:shadow-lg transition-all duration-300 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <Icon className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="text-right">
                  <div className="text-3xl font-black text-foreground">
                    {count.toLocaleString()}
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {count === 1 ? "ITEM" : "ITEMS"}
                  </span>
                </div>
              </div>

              {/* Label & Description */}
              <h3 className="text-lg font-bold text-foreground mb-1">
                {label}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {description}
              </p>

              {/* Featured Items */}
              {featured.length > 0 && (
                <div className="mb-4 flex-grow">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Featured
                  </h4>
                  <ul className="space-y-1.5">
                    {featured.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group/item"
                        >
                          <Zap className="h-3 w-3 text-muted-foreground group-hover/item:text-primary" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explore Link */}
              <Link
                href={href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mt-auto pt-4 border-t border-border/50"
              >
                Explore All {label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 p-6 rounded-lg bg-muted border border-border">
        <h3 className="font-semibold text-foreground mb-2">
          Building Your Investment Knowledge?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use our knowledge graph to research companies, understand market dynamics, and explore emerging opportunities.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            Start Exploring
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}

export default KnowledgeCategoriesRefactored;
