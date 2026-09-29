import type { Metadata } from "next";
import Link from "next/link";
import { getStorefrontProducts, getStorefrontCategories } from "@/lib/api/commerce";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

async function loadCategory(categorySlug: string) {
  const [categories, products] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontProducts(categorySlug),
  ]);
  const category = categories.find((c) => c.id === categorySlug);
  return { category, products };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const { category } = await loadCategory(categorySlug);
  const name = category?.name ?? categorySlug;
  const title = `${name} — Shop | Market Underworld`;
  const description = `Browse ${name} listings on Market Underworld — verified sellers, real inventory.`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${categorySlug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryIndexPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const { category, products } = await loadCategory(categorySlug);
  const name = category?.name ?? categorySlug;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    hasPart: products.map((p) => ({ "@type": "Product", name: p.name, url: `/shop/${categorySlug}/${p.slug}` })),
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e5e7eb] px-6 py-12 max-w-6xl mx-auto space-y-8">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: name }]} />
      <h1 className="text-4xl font-bold tracking-tight text-white">{name}</h1>

      {category && category.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {category.subcategories.map((sub) => (
            <span key={sub} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-400">{sub}</span>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-gray-500">No listings in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link key={p.id} href={`/shop/${categorySlug}/${p.slug}`} className="group block rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
              <div className="aspect-square bg-gray-900/50 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl?.[0] || 'https://picsum.photos/seed/mu/400/400'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-bold text-white line-clamp-2">{p.name}</p>
                <p className="text-xs text-gray-500">{p.price} {p.currencyCode}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
