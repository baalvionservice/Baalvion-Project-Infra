import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem, Mountain, Layers, Package, Ruler, Tag } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductCategories, getProducts, companyFacts } from "@/lib/content/store";
import { EmptyState } from "@/components/common/PendingDisclosure";
import { CategoryCard } from "@/components/products/CategoryCard";
import { ProductCard } from "@/components/products/ProductCard";

export const metadata: Metadata = {
  title: "Products & Minerals Catalogue",
  description:
    "Explore the Baalvion Mining Inc. products and minerals catalogue — minerals, quarry materials, aggregates, stone products, construction materials and industrial raw materials. Listings are published as supply lines are formally disclosed.",
  alternates: { canonical: "https://mining.baalvion.com/products" },
};

/**
 * Honest category taxonomy. These are generic, real industry categories that
 * describe the STRUCTURE of the catalogue we will offer — NOT live SKUs. No
 * product, price, grade, or specification is fabricated anywhere on this page.
 */
const CATEGORY_TAXONOMY = [
  {
    name: "Minerals",
    desc: "Raw and processed mineral commodities sourced for industrial and export supply.",
    icon: Gem,
  },
  {
    name: "Quarry Materials",
    desc: "Materials extracted from quarry operations for construction and processing.",
    icon: Mountain,
  },
  {
    name: "Aggregates",
    desc: "Graded crushed stone, gravel and sand for construction and infrastructure.",
    icon: Layers,
  },
  {
    name: "Stone Products",
    desc: "Dimensional and processed stone products for building and finishing.",
    icon: Package,
  },
  {
    name: "Construction Materials",
    desc: "Bulk materials supporting civil construction and infrastructure projects.",
    icon: Ruler,
  },
  {
    name: "Industrial Raw Materials",
    desc: "Feedstock and raw inputs for industrial manufacturing and processing.",
    icon: Tag,
  },
] as const;

export default async function ProductsPage() {
  const categories = await getProductCategories();
  const products = await getProducts();
  const featured = products.slice(0, 6);
  const categoryBySlug = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
            <Gem className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Catalogue
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Products &amp; Minerals Catalogue
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              {companyFacts.brand} supplies minerals, quarry materials and industrial
              raw materials to global buyers. Individual product lines are published
              here as they are formally and publicly disclosed.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-12 lg:py-16 space-y-16">
          {/* Live categories OR honest empty state */}
          {categories.length > 0 ? (
            <section className="space-y-8" aria-labelledby="categories-heading">
              <div className="space-y-2">
                <h2 id="categories-heading" className="text-2xl md:text-3xl font-bold text-primary">
                  Browse by Category
                </h2>
                <p className="text-slate-500 max-w-2xl">
                  Select a category to view the products currently published within it.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              title="Product catalogue coming soon"
              message="Our catalogue will be organised across Minerals, Quarry Materials, Aggregates, Stone Products, Construction Materials and Industrial Raw Materials. Individual product lines will appear here as supply lines are formally disclosed. For current availability and bulk sourcing, contact our trade desk."
              ctaHref="/contact"
              ctaLabel="Contact the trade desk"
            />
          )}

          {/* Featured products (only when present) */}
          {featured.length > 0 ? (
            <section className="space-y-8" aria-labelledby="featured-heading">
              <div className="space-y-2">
                <h2 id="featured-heading" className="text-2xl md:text-3xl font-bold text-primary">
                  Featured Products
                </h2>
                <p className="text-slate-500 max-w-2xl">
                  A selection of currently published supply lines.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    category={categoryBySlug.get(product.categoryId)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Static, honest category structure — the taxonomy we will offer */}
          <section className="space-y-8" aria-labelledby="structure-heading">
            <div className="space-y-2">
              <h2 id="structure-heading" className="text-2xl md:text-3xl font-bold text-primary">
                Category Structure
              </h2>
              <p className="text-slate-500 max-w-2xl">
                The catalogue is organised across the following industry categories.
                These describe the structure of our offering — specific products,
                grades and specifications are published only once formally disclosed.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CATEGORY_TAXONOMY.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Card key={cat.name} className="border border-slate-100 shadow-sm h-full">
                    <CardContent className="p-6 space-y-3">
                      <div className="inline-flex p-3 rounded-xl bg-primary/5 text-primary">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-bold text-primary">{cat.name}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{cat.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold">Looking for a specific material?</h2>
              <p className="text-primary-foreground/70 leading-relaxed">
                Tell our sourcing team what you need. We facilitate bulk industrial and
                commodity supply against your specification, volume and destination.
              </p>
            </div>
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8 font-bold text-lg rounded-2xl shrink-0">
              <Link href="/contact">Request a quote</Link>
            </Button>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
