import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontProduct, getRelatedProducts } from "@/lib/api/commerce";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductDetailClient } from "@/components/shop/ProductDetailClient";

interface PageProps {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}

async function loadProduct(productSlug: string) {
  try {
    return await getStorefrontProduct(productSlug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const product = await loadProduct(productSlug);
  if (!product) return { title: "Listing not found" };

  // seoMetadata.title/description (set by the seller in the listing-edit SEO panel) take
  // priority; fall back to the listing's own name/description so every PDP still gets sane
  // metadata even when a seller hasn't filled in the SEO fields.
  const title = product.seoTitle || `${product.name} | Market Underworld`;
  const description = product.seoDescription || product.description?.slice(0, 160) || `${product.name} — available now on Market Underworld.`;
  const canonicalPath = `/shop/${categorySlug}/${productSlug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      images: product.imageUrl?.length ? [{ url: product.imageUrl[0] }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { categorySlug, productSlug } = await params;
  const product = await loadProduct(productSlug);
  if (!product) notFound();

  const related = await getRelatedProducts(productSlug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription || product.description,
    image: product.imageUrl,
    sku: product.id,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currencyCode,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.ratingCount > 0 ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAverage, reviewCount: product.ratingCount },
    } : {}),
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e5e7eb] px-6 py-12 max-w-6xl mx-auto space-y-8">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          { label: product.categoryName || categorySlug, href: `/shop/${categorySlug}` },
          { label: product.name },
        ]}
      />
      <ProductDetailClient product={product} related={related} categorySlug={categorySlug} />
    </div>
  );
}
