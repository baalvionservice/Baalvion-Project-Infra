import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductCategories,
  getProductsByCategory,
} from "@/lib/content/store";
import type { ProductCategory } from "@/lib/content/types";
import { EmptyState } from "@/components/common/PendingDisclosure";
import { ProductCard } from "@/components/products/ProductCard";

type Params = { category: string };

async function findCategory(slug: string): Promise<ProductCategory | null> {
  const categories = await getProductCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await findCategory(slug);
  const name = category?.name ?? "Products";
  const description =
    category?.description ??
    `Browse ${name} from Baalvion Mining Inc. Product lines are published as they are formally disclosed.`;

  return {
    title: `${name} | Products`,
    description,
    alternates: { canonical: `https://mining.baalvion.com/products/${slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category: slug } = await params;
  const category = await findCategory(slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(slug);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-14 lg:py-20 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
            <Layers className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <nav aria-label="Breadcrumb" className="text-sm text-primary-foreground/60">
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link href="/products" className="hover:text-primary-foreground transition-colors">
                    Products
                  </Link>
                </li>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <li className="text-primary-foreground/90 font-medium">{category.name}</li>
              </ol>
            </nav>
            <Badge className="bg-secondary/20 text-secondary border-secondary/30">
              Category
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              {category.name}
            </h1>
            {category.description ? (
              <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
                {category.description}
              </p>
            ) : null}
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-12 lg:py-16 space-y-12">
          {products.length > 0 ? (
            <section className="space-y-8" aria-labelledby="products-heading">
              <h2 id="products-heading" className="sr-only">
                {category.name} products
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} category={category} />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              title={`${category.name} listings coming soon`}
              message={`Products within ${category.name} will be published here as supply lines are formally disclosed. For current availability and bulk sourcing, contact our trade desk.`}
              ctaHref="/contact"
              ctaLabel="Contact the trade desk"
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
            <p className="text-sm text-slate-500">
              Looking for something specific within {category.name}?
            </p>
            <Button asChild variant="outline" className="font-bold rounded-xl">
              <Link href="/products">Back to catalogue</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
