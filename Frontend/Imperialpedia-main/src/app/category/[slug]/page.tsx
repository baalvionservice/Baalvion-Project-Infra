import { NewsLayout } from "@/app/latest/components/NewsLayout";
import { Breadcrumbs } from "@/modules/seo-engine/components/Breadcrumbs";
import { breadcrumbService } from "@/modules/seo-engine/services/breadcrumb-service";
import { notFound } from "next/navigation";

const categoryMap: Record<string, string> = {
  markets: "Markets",
  economy: "Economy",
  crypto: "Crypto",
  banking: "Banking",
  startups: "Startups",
  globalmarkets: "GlobalMarkets",
  realestate: "RealEstate",
  personalfinance: "PersonalFinance",
};

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return Object.keys(categoryMap).map((slug) => ({
    slug,
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const slug = (await params).slug.toLowerCase();
  const category = categoryMap[slug];

  if (!category) {
    notFound();
  }

  // This page had neither a visible breadcrumb trail nor BreadcrumbList
  // schema before — the shared engine component supplies both from one call.
  const breadcrumb = breadcrumbService.generateBreadcrumbForCategory(category, slug);

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-6">
        <Breadcrumbs breadcrumb={breadcrumb} className="mb-0" />
      </div>
      <NewsLayout initialCategory={category} />
    </>
  );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const category = categoryMap[(await params).slug.toLowerCase()];

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category} News - Latest Updates`,
    description: `Stay updated with the latest ${category.toLowerCase()} news and analysis`,
  };
}
