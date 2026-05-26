import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMockNewsById } from "@/data/mockNews";
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface NewsDetailPageProps {
  params: {
    id: string;
  };
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const article = getMockNewsById(params.id);

  if (!article) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/latest"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to News
        </Link>

        {/* Article */}
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8">
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-md ${getCategoryColor(
                  article.category
                )}`}
              >
                {article.category}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {article.title}
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {article.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span className="font-medium">{article.source}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="aspect-[16/9] relative">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {article.content ? (
                <div className="space-y-4">
                  {article.content.split("\n\n").map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {article.description}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    This is a detailed analysis of the current market situation.
                    The financial markets have been experiencing significant
                    volatility in recent weeks, with various factors
                    contributing to the uncertainty.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Investors are closely monitoring economic indicators and
                    policy decisions that could impact market direction. The
                    current environment requires careful consideration of risk
                    management strategies and portfolio diversification.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Market analysts suggest that while short-term volatility is
                    expected to continue, the long-term outlook remains
                    cautiously optimistic based on fundamental economic
                    indicators and corporate earnings trends.
                  </p>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Related Articles
          </h2>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Related articles will be implemented with real API integration
          </div>
        </div>
      </div>
    </div>
  );
}

export function generateMetadata({ params }: NewsDetailPageProps) {
  const article = getMockNewsById(params.id);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: [article.image],
    },
  };
}
