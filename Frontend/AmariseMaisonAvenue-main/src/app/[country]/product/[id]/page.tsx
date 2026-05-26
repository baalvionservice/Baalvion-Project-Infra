import React from "react";
import { PRODUCTS, COUNTRIES } from "@/lib/mock-data";
import { ChevronRight } from "lucide-react";
import { ProductGallery } from "@/components/product/ProductGallery";
import Link from "next/link";
import ProductInfoPanel from "@/components/product/ProductInfoPanel";
import YouMayAlsoLike from "@/components/product/YouMayAlsoLike";
import CustomerReviews from "@/components/product/CustomerReviews";
import { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{
    id: string;
    country: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id, country } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  const countryData = COUNTRIES[country] || COUNTRIES.us;

  if (!product) {
    return {
      title: "Product Not Found | Amarisé Luxe",
      description:
        "The requested luxury artifact could not be found in our registry.",
    };
  }

  const seoTitle =
    product.seoTitle || `${product.name} | Amarisé Luxe ${countryData.name}`;
  const seoDescription =
    product.seoDescription ||
    `Discover the exquisite ${product.name} at Amarisé Luxe. Premium luxury artifacts with heritage craftsmanship. Available in ${countryData.name}.`;

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: [
        {
          url: product.imageUrl[0],
          width: 800,
          height: 1000,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [product.imageUrl[0]],
    },
  };
}

/**
 * ProductPage: Institutional Artifact View.
 * Optimized for high-fidelity technical detail and SEO authority.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { id, country } = await params;
  const countryCode = country || "us";

  const product = PRODUCTS.find((p) => p.id === id);

  if (!product)
    return (
      <div className="py-20 sm:py-40 text-center font-headline text-2xl sm:text-3xl px-4">
        Artifact not found in registry.
      </div>
    );

  return (
    <div className="bg-white min-h-screen animate-fade-in font-body">
      {/* Container with responsive max-width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="py-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-normal text-black tracking-wide">
            <Link
              href={`/${countryCode}`}
              className="hover:text-gray-600 transition-colors truncate"
            >
              Home
            </Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <span className="text-gray-900 text-xs font-bold truncate">
              {product.name}
            </span>
          </div>
        </nav>

      <main className=" lg:px-12 py-6 lg:py-2">
        <div className="flex flex-col lg:flex-row ">
          {/* Column 1: Gallery & Visual Authority */}
          <div className="flex-1 space-y-16 min-w-0">
            <ProductGallery
              images={product.imageUrl}
              productName={product.name}
            />
          </div>

            {/* Product Info Section */}
            <div className="flex-1 pl-3 pt-3 md:pt-0 lg:order-2 lg:sticky lg:top-8 lg:self-start">
              <ProductInfoPanel product={product} countryCode={countryCode} />
            </div>
          </div>
        </main>

        {/* Additional Sections */}
        <div className="space-y-16 sm:space-y-20">
          <YouMayAlsoLike />
          <CustomerReviews />
        </div>
      </div>
    </div>
  );
}
