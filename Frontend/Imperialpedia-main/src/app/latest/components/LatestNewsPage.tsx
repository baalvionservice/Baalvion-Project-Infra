"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { NewsArticle, generateMockNews } from "@/data/mockNews";

export function LatestNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newsData = generateMockNews(1, 20);
      setArticles(newsData);
      setLoading(false);
    };
    loadArticles();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} MIN AGO`;
    if (diffInHours < 24)
      return `${diffInHours} HOUR${diffInHours > 1 ? "S" : ""} AGO`;
    return date
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white mt-12 w-full overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 rounded w-48 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
            <div className="aspect-video bg-gray-200 rounded" />
            <div className="aspect-video bg-gray-100 rounded md:min-h-[200px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const heroStory = articles[0];
  const rightStory = articles[1];
  const midCards = articles.slice(2, 5);
  const imageTextRow = articles.slice(5, 8);
  const textOnlyRow = articles.slice(8, 11);
  const trendingItems = articles.slice(0, 5);

  return (
    <div className="min-h-screen bg-white mt-12 w-full overflow-x-hidden">
      <div className="text-center pt-3 sm:pt-4 mb-3 sm:mb-4 border-b-[3px] border-yellow-400 px-2 sm:px-3">
        <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-[0.1em] sm:tracking-[0.15em] lg:tracking-[2px] uppercase text-[#0a2756] pb-2">
          Latest News
        </h1>
      </div>
      <div className="max-w-3xl mx-auto px-2 sm:px-3 lg:px-4 pb-8 sm:pb-12 w-full">
        <div className="flex flex-col md:grid md:grid-cols-[2fr_1fr] gap-3 sm:gap-4 mb-3 sm:mb-4">
          {heroStory && (
            <div className="min-w-0">
              <Link href={heroStory.url} className="group block">
                <div className="aspect-video relative overflow-hidden w-full rounded-sm">
                  <Image
                    src={heroStory.image}
                    alt={heroStory.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                    priority
                    loading="eager"
                  />
                </div>
                <h2 className="text-sm sm:text-[15px] lg:text-[17px] font-bold leading-snug text-black group-hover:text-[#1565c0] mt-1.5 sm:mt-2 mb-1 sm:mb-1.5">
                  {heroStory.title}
                </h2>
              </Link>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#0a6bb5]">
                  {heroStory.source}
                </span>
                <span className="text-[10px] sm:text-[11px] text-gray-500 uppercase">
                  {formatDate(heroStory.publishedAt)}
                </span>
              </div>
            </div>
          )}

          {rightStory && (
            <div className="min-w-0 border-t border-gray-200 pt-4 md:border-t-0 md:border-l md:border-gray-200 md:pt-0 md:pl-3">
              <Link href={rightStory.url} className="group block">
                <div className="aspect-video relative overflow-hidden w-full mb-2 rounded-sm">
                  <Image
                    src={rightStory.image}
                    alt={rightStory.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 280px"
                  />
                </div>
                <div className="flex items-start gap-1.5 flex-wrap">
                  <span className="bg-[#004a99] text-white text-[9px] font-bold px-1.5 py-0.5 tracking-wide shrink-0 mt-0.5">
                    PRO
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold leading-snug text-black group-hover:text-[#1565c0]">
                    {rightStory.title}
                  </span>
                </div>
              </Link>
              <div className="mt-1.5">
                <span className="text-[11px] font-bold text-[#0a6bb5] mr-1.5">
                  {rightStory.source}
                </span>
                <span className="text-[11px] text-gray-500 uppercase">
                  {formatDate(rightStory.publishedAt)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 border-t border-gray-200 pt-4">
          {midCards.map((article) => (
            <div key={article.id} className="min-w-0">
              <Link href={article.url} className="group block">
                <div className="aspect-video relative overflow-hidden w-full mb-1.5 rounded-sm">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
                  />
                </div>
                <span className="text-[9px] font-bold text-[#0a6bb5] uppercase tracking-[0.5px] mb-1 block">
                  {article.category}
                </span>
                <h3 className="text-[13px] font-bold leading-snug text-black group-hover:text-[#1565c0] mb-1">
                  {article.title}
                </h3>
              </Link>
              <span className="text-[10px] font-bold text-[#0a6bb5] mr-1">
                {article.source}
              </span>
              <span className="text-[10px] text-gray-500 uppercase">
                {formatDate(article.publishedAt)}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 border-t border-gray-200 pt-4 mt-4">
          {imageTextRow.map((article) => (
            <div key={article.id} className="min-w-0">
              <Link href={article.url} className="group block">
                <div className="aspect-video relative overflow-hidden w-full mb-1.5 rounded-sm">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
                  />
                </div>
                <span className="text-[9px] font-bold text-[#0a6bb5] uppercase tracking-[0.5px] mb-1 block">
                  {article.category}
                </span>
                <h3 className="text-[13px] font-bold leading-snug text-black group-hover:text-[#1565c0] mb-1">
                  {article.title}
                </h3>
              </Link>
              <span className="text-[10px] text-gray-500 uppercase">
                {formatDate(article.publishedAt)}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 border-t border-gray-200 pt-4 mt-4">
          {textOnlyRow.map((article) => (
            <div key={article.id} className="min-w-0">
              <Link href={article.url} className="group block">
                <span className="text-[9px] font-bold text-[#0a6bb5] uppercase tracking-[0.5px] mb-1 block">
                  {article.category}
                </span>
                <h3 className="text-[13px] font-bold leading-snug text-black group-hover:text-[#1565c0] mb-1">
                  {article.title}
                </h3>
              </Link>
              <span className="text-[10px] text-gray-500 uppercase">
                {formatDate(article.publishedAt)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t-[3px] border-yellow-400">
          <h2 className="text-base sm:text-[15px] font-bold tracking-[1px] uppercase text-[#0a2756] mb-4 px-0.5">
            Trending Now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-0">
            {trendingItems.map((article, i) => (
              <Link
                key={article.id}
                href={article.url}
                className="group block lg:pl-2 lg:pr-3 lg:border-r-4 lg:border-gray-200 lg:last:border-r-0 min-w-0"
              >
                <div className="text-2xl sm:text-[28px] font-bold text-gray-300 leading-none mb-2">
                  {i + 1}
                </div>
                <p className="text-[11px] sm:text-[12px] font-bold leading-snug text-black group-hover:text-[#1565c0]">
                  {article.title}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-[3px] border-yellow-400">
          <h2 className="text-sm sm:text-[15px] font-bold tracking-[1px] uppercase text-[#0a2756] mb-4 px-0.5">
            More in Latest News
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-3 mt-4">
            {articles.slice(11).map((article) => (
              <div key={article.id} className="min-w-0">
                <Link href={article.url} className="group block">
                  <div className="aspect-video relative overflow-hidden w-full mb-1.5 rounded-sm">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[#0a6bb5] uppercase tracking-[0.5px] mb-1 block">
                    {article.category}
                  </span>
                  <h3 className="text-[13px] font-bold leading-snug text-black group-hover:text-[#1565c0] mb-1">
                    {article.title}
                  </h3>
                </Link>
                <span className="text-[10px] text-gray-500 uppercase">
                  {formatDate(article.publishedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
