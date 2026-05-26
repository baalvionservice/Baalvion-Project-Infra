"use client";

import { useState } from "react";
import { CategoryFilter } from "./CategoryFilter";
import { NewsGrid } from "./NewsGrid";
import { TrendingNews } from "./TrendingNews";

interface NewsLayoutProps {
  initialCategory?: string;
  showCategories?: boolean;
  showSidebar?: boolean;
}

export function NewsLayout({
  initialCategory = "All",
  showCategories = true,
  showSidebar = true,
}: NewsLayoutProps) {
  const [currentCategory, setCurrentCategory] = useState(initialCategory);

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-12 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Latest News
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Stay updated with the latest financial and business news
              </p>
            </div>
          </div>

          {showCategories && (
            <CategoryFilter
              currentCategory={currentCategory}
              onCategoryChange={handleCategoryChange}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div
          className={`${
            showSidebar ? "flex flex-col lg:grid lg:grid-cols-4 lg:gap-8" : ""
          }`}
        >
          {/* Main Content */}
          <div className={`${showSidebar ? "lg:col-span-3" : ""} order-1`}>
            <NewsGrid category={currentCategory} />
          </div>

          {/* Sidebar - Show on top on mobile */}
          {showSidebar && (
            <div className="lg:col-span-1 mb-6 lg:mb-0 lg:mt-0 order-0 lg:order-1">
              <div className="space-y-6 sm:space-y-8 lg:sticky lg:top-8">
                <TrendingNews />

                {/* Market Summary Widget */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Market Summary
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        S&P 500
                      </span>
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          4,567.89
                        </div>
                        <div className="text-[10px] sm:text-xs text-green-600">
                          +1.2%
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        NASDAQ
                      </span>
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          14,234.56
                        </div>
                        <div className="text-[10px] sm:text-xs text-green-600">
                          +0.8%
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Bitcoin
                      </span>
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          $52,345
                        </div>
                        <div className="text-[10px] sm:text-xs text-red-600">
                          -2.1%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      Market data is delayed by 15 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
