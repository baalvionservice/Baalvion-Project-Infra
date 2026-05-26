"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ChevronLeft, ChevronRight, Loader2, Newspaper } from "lucide-react";
import { Article } from "@/lib/db";
import { SubPageHero } from "@/components/sub-page-hero";
import Image from "next/image";
import Link from "next/link";

interface NewsCategoryPageProps {
  category: string;
  title: string;
  categoryLabel: string;
  categoryName: string;
}

export function NewsCategoryPage({
  category,
  title,
  categoryLabel,
  categoryName,
}: NewsCategoryPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/news?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Syncing Intelligence...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <SubPageHero category={categoryLabel} title={title} />

        <div className="section-container py-24">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-12 border-b border-gray-100 pb-6">
            <p className="text-sm font-medium text-gray-500">
              Showing {articles.length} strategic results from the{" "}
              {categoryName} nexus
            </p>
            <div className="flex items-center gap-6 text-[10px] font-bold text-gray-900 uppercase tracking-widest">
              <button className="flex items-center gap-1.5 opacity-40 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* News Grid */}
          {articles.length === 0 ? (
            <div className="py-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                No strategic updates found in this category nexus.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {articles.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${category}/${news.slug}`}
                  className="group flex flex-col gap-5"
                >
                  <div className="aspect-[16/10] relative rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                    <Image
                      src={news.image}
                      alt={news.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      data-ai-hint="news coverage"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold leading-snug text-gray-900 group-hover:text-primary transition-colors line-clamp-3">
                      {news.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {news.date}
                      </span>
                      <span className="w-1 h-1 bg-gray-200 rounded-full" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        {categoryLabel}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Bottom Pagination */}
          {articles.length > 0 && (
            <div className="mt-24 pt-10 border-t border-gray-100 flex justify-center">
              <div className="flex items-center gap-8 text-[11px] font-bold text-gray-900 uppercase tracking-widest">
                <button className="flex items-center gap-1.5 opacity-40 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex items-center gap-6">
                  <span className="text-primary border-b-2 border-primary pb-1">
                    01
                  </span>
                </div>
                <button className="flex items-center gap-1.5 opacity-40 cursor-not-allowed">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
