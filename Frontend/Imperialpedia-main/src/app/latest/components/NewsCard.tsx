import Image from "next/image";
import Link from "next/link";
import { NewsArticle } from "@/data/mockNews";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "default" | "featured" | "compact";
}

export function NewsCard({ article, variant = "default" }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Markets:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Economy:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      Crypto:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      Banking:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      Startups:
        "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      GlobalMarkets:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      RealEstate:
        "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
      PersonalFinance:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    return (
      colors[category] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    );
  };

  if (variant === "featured") {
    return (
      <Link href={article.url} className="group block">
        <article className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
          <div className="aspect-[16/9] relative overflow-hidden">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute top-4 left-4">
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded-md ${getCategoryColor(
                  article.category
                )}`}
              >
                {article.category}
              </span>
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {article.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
              {article.description}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">{article.source}</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={article.url} className="group block">
        <article className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="flex-shrink-0 w-20 h-20 relative overflow-hidden rounded-md">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${getCategoryColor(
                  article.category
                )}`}
              >
                {article.category}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{article.source}</span>
              <span>•</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={article.url} className="group block">
      <article className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-[16/9] relative overflow-hidden">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3">
            <span
              className={`inline-block px-2 py-1 text-xs font-semibold rounded-md ${getCategoryColor(
                article.category
              )}`}
            >
              {article.category}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {article.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {article.description}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">{article.source}</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
