import { NewsLayout } from "@/app/latest/components/NewsLayout";
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
  const category = categoryMap[(await params).slug];

  if (!category) {
    notFound();
  }

  return <NewsLayout initialCategory={category} />;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const category = categoryMap[(await params).slug];

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
