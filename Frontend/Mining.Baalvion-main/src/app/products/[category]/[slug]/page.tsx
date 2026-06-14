import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Gem,
  ChevronRight,
  Ruler,
  Tag,
  FileText,
  Download,
  Package,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getProduct, getProductCategories } from "@/lib/content/store";
import type { Product, ProductCategory } from "@/lib/content/types";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";
import { ProductInquiryForm } from "@/components/products/ProductInquiryForm";

type Params = { category: string; slug: string };

/** Turn a URL slug into a readable, honest display name when no record exists. */
function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProduct(slug);
  const name = product?.name ?? humanizeSlug(slug);
  const description =
    product?.description ??
    `${name} — product details from Baalvion Mining Inc. Specifications are published once formally disclosed. Submit an inquiry for current availability.`;

  return {
    title: `${name} | Products`,
    description,
    alternates: {
      canonical: `https://mining.baalvion.com/products/${category}/${slug}`,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category: categorySlug, slug } = await params;
  const product = await getProduct(slug);
  const categories = await getProductCategories();
  const category: ProductCategory | undefined =
    categories.find((c) => c.slug === categorySlug) ??
    (product ? categories.find((c) => c.id === product.categoryId) : undefined);

  const displayName = product?.name ?? humanizeSlug(slug);
  const categoryName = category?.name ?? humanizeSlug(categorySlug);
  const heroImage = product?.gallery[0]?.url ?? BRAND_IMAGES.mineral;
  const heroAlt = product?.gallery[0]?.alt ?? `${displayName} sample`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb header */}
        <section className="bg-primary text-primary-foreground py-12 lg:py-16">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <nav aria-label="Breadcrumb" className="text-sm text-primary-foreground/60">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/products" className="hover:text-primary-foreground transition-colors">
                    Products
                  </Link>
                </li>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <li>
                  <Link
                    href={`/products/${categorySlug}`}
                    className="hover:text-primary-foreground transition-colors"
                  >
                    {categoryName}
                  </Link>
                </li>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <li className="text-primary-foreground/90 font-medium">{displayName}</li>
              </ol>
            </nav>
            <Badge className="bg-secondary/20 text-secondary border-secondary/30">
              <Package className="h-3 w-3 mr-1" aria-hidden="true" /> Product
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              {displayName}
            </h1>
            {!product ? (
              <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
                Full product details for this line are being prepared. Submit an
                inquiry below and our sourcing team will respond with current
                availability and specification.
              </p>
            ) : null}
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-12 lg:py-16">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-start">
            {/* Left: details */}
            <div className="space-y-12">
              {/* Gallery */}
              <section aria-labelledby="gallery-heading" className="space-y-4">
                <h2 id="gallery-heading" className="sr-only">
                  Gallery
                </h2>
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                  <Image
                    src={heroImage}
                    alt={heroAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                    priority
                  />
                </div>
                {product && product.gallery.length > 1 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {product.gallery.slice(1, 5).map((asset, i) => (
                      <div
                        key={`${asset.url}-${i}`}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-100"
                      >
                        <Image
                          src={asset.url}
                          alt={asset.alt}
                          fill
                          sizes="25vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              {/* Description */}
              <section aria-labelledby="description-heading" className="space-y-3">
                <h2 id="description-heading" className="text-2xl font-bold text-primary">
                  Description
                </h2>
                {product?.description ? (
                  <p className="text-slate-600 leading-relaxed">{product.description}</p>
                ) : (
                  <PendingDisclosure label="Product description pending company disclosure." />
                )}
              </section>

              {/* Specifications */}
              <section aria-labelledby="specs-heading" className="space-y-3">
                <h2 id="specs-heading" className="text-2xl font-bold text-primary">
                  Specifications
                </h2>
                {product && product.specifications.length > 0 ? (
                  <Card className="border border-slate-100 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {product.specifications.map((spec, i) => (
                            <TableRow key={`${spec.label}-${i}`}>
                              <TableCell className="font-semibold text-slate-700 w-1/2">
                                {spec.label}
                              </TableCell>
                              <TableCell className="text-slate-600">{spec.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <PendingDisclosure label="Technical specifications pending company disclosure." />
                )}
              </section>

              {/* Grade & Size */}
              <section aria-labelledby="gradesize-heading" className="space-y-3">
                <h2 id="gradesize-heading" className="text-2xl font-bold text-primary">
                  Grade &amp; Size
                </h2>
                {product && (product.grade || product.size) ? (
                  <div className="flex flex-wrap gap-3">
                    {product.grade ? (
                      <Badge variant="outline" className="text-sm font-semibold text-slate-700 px-4 py-2">
                        <Tag className="h-4 w-4 mr-1.5" aria-hidden="true" /> Grade: {product.grade}
                      </Badge>
                    ) : null}
                    {product.size ? (
                      <Badge variant="outline" className="text-sm font-semibold text-slate-700 px-4 py-2">
                        <Ruler className="h-4 w-4 mr-1.5" aria-hidden="true" /> Size: {product.size}
                      </Badge>
                    ) : null}
                  </div>
                ) : (
                  <PendingDisclosure label="Grade and size details pending company disclosure." />
                )}
              </section>

              {/* Applications */}
              <section aria-labelledby="applications-heading" className="space-y-3">
                <h2 id="applications-heading" className="text-2xl font-bold text-primary">
                  Applications
                </h2>
                {product && product.applications.length > 0 ? (
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {product.applications.map((app, i) => (
                      <li
                        key={`${app}-${i}`}
                        className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600"
                      >
                        <Gem className="h-4 w-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                        {app}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <PendingDisclosure label="Applications pending company disclosure." />
                )}
              </section>

              {/* Technical Datasheets */}
              <section aria-labelledby="datasheets-heading" className="space-y-3">
                <h2 id="datasheets-heading" className="text-2xl font-bold text-primary">
                  Technical Datasheets
                </h2>
                {product && product.datasheets.length > 0 ? (
                  <ul className="space-y-3">
                    {product.datasheets.map((sheet, i) => (
                      <li key={`${sheet.url}-${i}`}>
                        <a
                          href={sheet.url}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary transition-colors"
                        >
                          <span className="inline-flex items-center gap-2">
                            <FileText className="h-5 w-5 text-secondary" aria-hidden="true" />
                            {sheet.alt || sheet.caption || "Technical datasheet"}
                          </span>
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-4 text-slate-500">
                    <FileText className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                    <p className="text-sm">Technical datasheets available on request.</p>
                  </div>
                )}
              </section>
            </div>

            {/* Right: inquiry form (sticky) */}
            <aside className="lg:sticky lg:top-24">
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-primary">Request a Quote</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Enquire about {displayName} — availability, specification and pricing on request.
                    </p>
                  </div>
                  <ProductInquiryForm productName={displayName} />
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
