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
    <div className="text-[#e5e7eb] px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          { label: product.categoryName || categorySlug, href: `/shop/${categorySlug}` },
          { label: product.name },
        ]}
      />
      <ProductDetailClient product={product} related={related} categorySlug={categorySlug} />
      {((product.documents?.length ?? 0) > 0 || product.infoLink) && (
        <section aria-label="More information" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
          <h2 className="text-lg font-bold text-white">More information from the seller</h2>
          <ul className="flex flex-wrap gap-3">
            {(product.documents ?? []).map((d, i) => (
              <li key={d.url + i}><a href={d.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center h-11 px-5 rounded-xl border border-white/15 hover:border-emerald-400/60 text-sm font-semibold">Open PDF: {d.name}</a></li>
            ))}
            {product.infoLink && (
              <li><a href={product.infoLink} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center h-11 px-5 rounded-xl border border-white/15 hover:border-emerald-400/60 text-sm font-semibold">Open the seller&apos;s information link</a></li>
            )}
          </ul>
          <p className="text-xs text-gray-500">These files and links belong to the seller and open on other sites or files. Hell Road does not control them.</p>
        </section>
      )}
    </div>
  );
}
